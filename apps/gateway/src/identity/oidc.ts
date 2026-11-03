import { fromBase64Url, toBase64Url } from "./sealed";

// OpenID Connect, authorization code with PKCE. Microsoft Entra ID and Google Workspace are OIDC
// providers, as is any OIDC identity provider; SAML is not covered here. `fetch` is injected, so
// the flow is proven against a simulated provider.

export interface OidcProvider {
  /** The provider's issuer URL: it serves `/.well-known/openid-configuration`. */
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string[];
}

export type OidcFetch = (url: string, init?: RequestInit) => Promise<Response>;

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

/** What the gateway keeps between the redirect and the callback (sealed in a short-lived cookie). */
export interface LoginState {
  state: string;
  nonce: string;
  verifier: string;
}

export interface Identity {
  /** The provider's stable id for the person. */
  subject: string;
  email: string;
  name: string;
}

export class OidcError extends Error {
  override name = "OidcError";
}

const encoder = new TextEncoder();
const random = () => toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

async function getJson(fetcher: OidcFetch, url: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new OidcError(`${url} answered ${response.status}.`);
  return response.json();
}

async function discover(provider: OidcProvider, fetcher: OidcFetch): Promise<Discovery> {
  const base = provider.issuer.replace(/\/+$/, "");
  const found = (await getJson(
    fetcher,
    `${base}/.well-known/openid-configuration`,
  )) as Partial<Discovery>;
  // The document must name the issuer we asked: otherwise another provider could pose as it.
  if (found.issuer !== provider.issuer)
    throw new OidcError("The issuer of the provider does not match.");
  if (!found.authorization_endpoint || !found.token_endpoint || !found.jwks_uri) {
    throw new OidcError("The provider's discovery document is incomplete.");
  }
  return found as Discovery;
}

/** The URL to send the person to, and the state to keep until they come back. */
export async function startLogin(
  provider: OidcProvider,
  fetcher: OidcFetch,
): Promise<{ url: string; login: LoginState }> {
  const discovery = await discover(provider, fetcher);
  const login: LoginState = { state: random(), nonce: random(), verifier: random() };
  const challenge = toBase64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(login.verifier))),
  );
  const url = new URL(discovery.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    scope: (provider.scopes ?? ["openid", "email", "profile"]).join(" "),
    state: login.state,
    nonce: login.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return { url: url.toString(), login };
}

interface Jwk {
  kid?: string;
  kty: string;
  alg?: string;
  use?: string;
}

const part = (jwt: string, index: number): unknown => {
  const bytes = fromBase64Url(jwt.split(".")[index] ?? "");
  if (!bytes) throw new OidcError("The ID token is malformed.");
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new OidcError("The ID token is malformed.");
  }
};

/** Checks an ID token: RS256 signature by a key of the provider, issuer, audience, expiry, nonce. */
async function verifyIdToken(
  idToken: string,
  provider: OidcProvider,
  discovery: Discovery,
  fetcher: OidcFetch,
  expected: { nonce: string; now: Date },
): Promise<Identity> {
  if (idToken.split(".").length !== 3) throw new OidcError("The ID token is malformed.");
  const header = part(idToken, 0) as { alg?: string; kid?: string };
  // Only RS256: never `none`, never a symmetric algorithm the provider's public key could be abused for.
  if (header.alg !== "RS256") throw new OidcError("The ID token is not signed with RS256.");
  const jwks = (await getJson(fetcher, discovery.jwks_uri)) as { keys?: Jwk[] };
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new OidcError("The ID token is signed by an unknown key.");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const [h, p, s] = idToken.split(".") as [string, string, string];
  const signature = fromBase64Url(s);
  const valid =
    signature !== undefined &&
    (await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, encoder.encode(`${h}.${p}`)));
  if (!valid) throw new OidcError("The ID token's signature is not valid.");

  const claims = part(idToken, 1) as Record<string, unknown>;
  if (claims.iss !== provider.issuer)
    throw new OidcError("The ID token comes from another issuer.");
  const audience = claims.aud;
  const audiences = Array.isArray(audience) ? audience : [audience];
  if (!audiences.includes(provider.clientId))
    throw new OidcError("The ID token is for another client.");
  if (typeof claims.exp !== "number" || expected.now.getTime() / 1000 >= claims.exp) {
    throw new OidcError("The ID token has expired.");
  }
  if (claims.nonce !== expected.nonce) throw new OidcError("The ID token's nonce does not match.");
  if (typeof claims.sub !== "string" || typeof claims.email !== "string") {
    throw new OidcError("The ID token has no subject or email.");
  }
  return {
    subject: claims.sub,
    email: claims.email,
    name: typeof claims.name === "string" ? claims.name : claims.email,
  };
}

/** The callback: checks the state, trades the code (with the PKCE verifier) and verifies the ID token. */
export async function completeLogin(options: {
  provider: OidcProvider;
  fetch: OidcFetch;
  now: Date;
  query: URLSearchParams;
  login: LoginState;
}): Promise<Identity> {
  const { provider, query, login } = options;
  if (query.get("error"))
    throw new OidcError(`The provider refused the sign-in: ${query.get("error")}.`);
  if (query.get("state") !== login.state) throw new OidcError("The state does not match.");
  const code = query.get("code");
  if (!code) throw new OidcError("The callback has no code.");

  const discovery = await discover(provider, options.fetch);
  const response = await options.fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: provider.redirectUri,
      client_id: provider.clientId,
      code_verifier: login.verifier,
      ...(provider.clientSecret ? { client_secret: provider.clientSecret } : {}),
    }),
  });
  if (!response.ok) throw new OidcError(`The token endpoint answered ${response.status}.`);
  const { id_token: idToken } = (await response.json()) as { id_token?: string };
  if (!idToken) throw new OidcError("The token endpoint returned no ID token.");
  return verifyIdToken(idToken, provider, discovery, options.fetch, {
    nonce: login.nonce,
    now: options.now,
  });
}
