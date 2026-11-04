import { createHash } from "node:crypto";
import { toBase64Url } from "./identity/authn/sealed";

// A simulated OIDC provider for the gateway's end-to-end tests: discovery, JWKS and a token
// endpoint with a real RSA key, and PKCE enforced the way a real provider does.
export const ISSUER = "https://idp.example.test";
const enc = new TextEncoder();

export async function simulatedProvider(
  email: string,
  now: Date,
  /** Entra ID and Google have their own issuer; `claims` adds to (or replaces) the ID token's. */
  options: { issuer?: string; claims?: Record<string, unknown> } = {},
) {
  const issuer = (options.issuer ?? ISSUER).replace(/\/+$/, "");
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1", use: "sig" };
  const codes = new Map<string, { challenge: string; nonce: string }>();
  const sign = async (claims: object) => {
    const body = `${toBase64Url(enc.encode(JSON.stringify({ alg: "RS256", kid: "k1" })))}.${toBase64Url(enc.encode(JSON.stringify(claims)))}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      pair.privateKey,
      enc.encode(body),
    );
    return `${body}.${toBase64Url(new Uint8Array(signature))}`;
  };
  const fetcher = (async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(input);
    if (url.pathname.endsWith("/.well-known/openid-configuration")) {
      return Response.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/jwks`,
      });
    }
    if (url.pathname.endsWith("/jwks")) return Response.json({ keys: [jwk] });
    if (url.pathname.endsWith("/token")) {
      const form = new URLSearchParams(String(init?.body));
      const issued = codes.get(form.get("code") ?? "");
      const verified = createHash("sha256")
        .update(form.get("code_verifier") ?? "")
        .digest("base64url");
      if (!issued || issued.challenge !== verified) {
        return Response.json({ error: "invalid_grant" }, { status: 400 });
      }
      return Response.json({
        id_token: await sign({
          iss: issuer,
          aud: "forgeron",
          sub: `idp-${email}`,
          email,
          name: "Someone",
          exp: Math.floor(now.getTime() / 1000) + 300,
          nonce: issued.nonce,
          ...options.claims,
        }),
      });
    }
    return new Response("nope", { status: 404 });
  }) as typeof fetch;
  /** The browser at the provider: signs in and comes back with a code. */
  const signIn = (authorizeUrl: string) => {
    const q = new URL(authorizeUrl).searchParams;
    codes.set("code-1", { challenge: q.get("code_challenge")!, nonce: q.get("nonce")! });
    return `?code=code-1&state=${q.get("state")}`;
  };
  return { fetcher, signIn };
}
