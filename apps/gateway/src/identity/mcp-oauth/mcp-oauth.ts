import type { Registry } from "@forgeron/registry";
import type { Person } from "../../kernel/person";
import { errorPage } from "../../pages/errors";
import { connectionHandBackPage, consentPage } from "../../pages/mcp-oauth";
import { MCP_SCOPE } from "../authn/caller";
import { sameOriginPost } from "../authn/origin";
import { seal, toBase64Url, unseal } from "../authn/sealed";
import { issueToken, verifyToken } from "../authn/tokens";

// OAuth 2.1 for MCP clients (D-094): what lets Claude and other clients sign in to the workspace's
// admin MCP at `/mcp` as the person who clicks "Allow". Authorization code with PKCE, public
// clients registered dynamically (RFC 7591), refresh tokens that rotate, revocation (RFC 7009).
// Nothing is stored for a client, a code or a refresh token: each is a value signed by the gateway
// (as the CLI's code is, D-028); a code and a refresh token are spent once in `cli_codes`, and a
// revocation is a row of `token_revocations` (D-035).

const CLIENT = "fgo";
const CODE = "fgk";
const REFRESH = "fgr";
const CODE_SECONDS = 60;
const ACCESS_SECONDS = 60 * 60;
const REFRESH_DAYS = 30;
/** The audience of an MCP token: the workspace's platform (the admin MCP), not a tool (D-079). */
const PLATFORM_TOOL = "platform";
const MAX_REDIRECTS = 5;
const encoder = new TextEncoder();

export interface McpOAuthContext {
  workspace: string;
  /** `https://<workspace>.<base domain>`: the issuer, and where the endpoints are. */
  origin: string;
  secret: string;
  previousSecrets?: string[];
  registry: Pick<Registry, "findMember" | "spendCode" | "revokeToken" | "isTokenRevoked">;
  now(): Date;
  /** The person of the session cookie; `undefined` if there is none. */
  session(request: Request): Promise<Person | undefined>;
}

const noStore = { "cache-control": "no-store" };
const oauthError = (status: number, error: string, description: string) =>
  Response.json({ error, error_description: description }, { status, headers: noStore });

/** `https`, or `http` on the machine itself (a desktop client listens there). No credentials, no fragment. */
function redirectAllowed(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.hash || url.username || url.password || value.length > 500) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

/** The documents a client reads to find out how to sign in (RFC 9728 and RFC 8414). */
export function metadata(request: Request, context: McpOAuthContext): Response | undefined {
  const path = new URL(request.url).pathname;
  const headers = { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" };
  if (request.method !== "GET") return undefined;
  if (/^\/\.well-known\/oauth-protected-resource(\/mcp)?$/.test(path)) {
    return Response.json(
      {
        resource: `${context.origin}/mcp`,
        authorization_servers: [context.origin],
        bearer_methods_supported: ["header"],
        scopes_supported: [MCP_SCOPE],
        resource_name: `${context.workspace} on Forgeron`,
      },
      { headers },
    );
  }
  if (path === "/.well-known/oauth-authorization-server") {
    return Response.json(
      {
        issuer: context.origin,
        authorization_endpoint: `${context.origin}/oauth/authorize`,
        token_endpoint: `${context.origin}/oauth/token`,
        registration_endpoint: `${context.origin}/oauth/register`,
        revocation_endpoint: `${context.origin}/oauth/revoke`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
        scopes_supported: [MCP_SCOPE],
      },
      { headers },
    );
  }
  return undefined;
}

/** `POST /oauth/register`: a client says who it is and where answers go; it gets a signed `client_id`. */
export async function handleRegister(request: Request, context: McpOAuthContext) {
  if (request.method !== "POST") return oauthError(405, "invalid_request", "Use POST.");
  const body = (await request.json().catch(() => undefined)) as
    | { redirect_uris?: unknown; client_name?: unknown; token_endpoint_auth_method?: unknown }
    | undefined;
  const uris = body?.redirect_uris;
  if (
    !Array.isArray(uris) ||
    uris.length === 0 ||
    uris.length > MAX_REDIRECTS ||
    !uris.every((u): u is string => typeof u === "string" && redirectAllowed(u))
  ) {
    return oauthError(
      400,
      "invalid_redirect_uri",
      "Give 1 to 5 redirect_uris: https, or http on this machine.",
    );
  }
  if (
    body?.token_endpoint_auth_method !== undefined &&
    body.token_endpoint_auth_method !== "none"
  ) {
    return oauthError(400, "invalid_client_metadata", "Only public clients (method none).");
  }
  const name =
    typeof body?.client_name === "string" && body.client_name.trim()
      ? body.client_name.trim().slice(0, 80)
      : "An MCP client";
  const clientId = await seal(
    CLIENT,
    { ws: context.workspace, ru: uris, nm: name, iat: Math.floor(context.now().getTime() / 1000) },
    context.secret,
  );
  return Response.json(
    {
      client_id: clientId,
      client_name: name,
      redirect_uris: uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201, headers: noStore },
  );
}

interface Client {
  id: string;
  name: string;
  redirects: string[];
}

async function clientOf(id: string, context: McpOAuthContext): Promise<Client | undefined> {
  const claims = await unseal(CLIENT, id, context.secret);
  if (!claims || claims.ws !== context.workspace) return undefined;
  const { ru, nm } = claims;
  if (!Array.isArray(ru) || typeof nm !== "string") return undefined;
  return { id, name: nm, redirects: ru.filter((u): u is string => typeof u === "string") };
}

/**
 * `GET /oauth/authorize` asks the signed-in person to allow the client, `POST` carries their
 * answer: nothing is handed over without a click, as for `forgeron login` (D-053).
 */
export async function handleAuthorize(request: Request, context: McpOAuthContext) {
  const url = new URL(request.url);
  const posting = request.method === "POST";
  if (request.method !== "GET" && !posting) {
    return errorPage(405, { workspace: context.workspace, headers: { allow: "GET, POST" } });
  }
  if (posting && !sameOriginPost(request)) {
    return errorPage(403, {
      workspace: context.workspace,
      detail: "This request did not come from the authorization page.",
    });
  }
  const form = posting ? await request.formData().catch(() => undefined) : undefined;
  if (posting && !form) return errorPage(400, { workspace: context.workspace });
  const params = new URLSearchParams(
    posting
      ? [...form!.entries()].filter((e): e is [string, string] => typeof e[1] === "string")
      : url.searchParams,
  );
  const bad = (detail: string) => errorPage(400, { workspace: context.workspace, detail });

  // A client or a redirect address that is not the registered one gets no redirect at all.
  const client = await clientOf(params.get("client_id") ?? "", context);
  if (!client) return bad("This app is not registered with this workspace.");
  const redirectUri = params.get("redirect_uri") ?? "";
  if (!client.redirects.includes(redirectUri)) {
    return bad("This address is not one the app registered.");
  }
  const state = params.get("state") ?? "";
  const challenge = params.get("code_challenge") ?? "";
  if (params.get("response_type") !== "code") return bad("response_type must be code.");
  if (!challenge || params.get("code_challenge_method") !== "S256") {
    return bad("A S256 code_challenge is required.");
  }
  const resource = params.get("resource");
  if (resource !== null && resource !== `${context.origin}/mcp`) {
    return bad("This workspace's MCP is the only resource it can give access to.");
  }
  const scope = params.get("scope");
  if (scope && scope.split(" ").some((s) => s !== MCP_SCOPE)) return bad("Unknown scope.");

  const person = await context.session(request);
  if (!person) {
    if (posting) return errorPage(401, { workspace: context.workspace });
    const next = `${url.pathname}${url.search}`;
    return new Response(null, {
      status: 302,
      headers: { location: `/auth/login?next=${encodeURIComponent(next)}` },
    });
  }
  const back = new URL(redirectUri);
  if (!posting) {
    return consentPage({
      workspace: context.workspace,
      person,
      clientName: client.name,
      address: back.host,
      fields: {
        response_type: "code",
        client_id: client.id,
        redirect_uri: redirectUri,
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
        ...(resource ? { resource } : {}),
        ...(scope ? { scope } : {}),
      },
    });
  }
  const answer = new URLSearchParams(state ? { state } : {});
  if (form!.get("decision") !== "allow") {
    answer.set("error", "access_denied");
    back.search = new URLSearchParams([...new URLSearchParams(back.search), ...answer]).toString();
    return connectionHandBackPage({
      workspace: context.workspace,
      to: back.toString(),
      allowed: false,
    });
  }
  const code = await seal(
    CODE,
    {
      jti: toBase64Url(crypto.getRandomValues(new Uint8Array(16))),
      sub: person.id,
      ws: context.workspace,
      cid: client.id,
      ch: challenge,
      ru: redirectUri,
      exp: Math.floor(context.now().getTime() / 1000) + CODE_SECONDS,
    },
    context.secret,
  );
  answer.set("code", code);
  back.search = new URLSearchParams([...new URLSearchParams(back.search), ...answer]).toString();
  return connectionHandBackPage({
    workspace: context.workspace,
    to: back.toString(),
    allowed: true,
  });
}

async function tokensFor(
  person: string,
  clientId: string,
  family: string,
  context: McpOAuthContext,
) {
  const now = context.now();
  const iat = Math.floor(now.getTime() / 1000);
  const access = await issueToken({
    secret: context.secret,
    person,
    workspace: context.workspace,
    tool: PLATFORM_TOOL,
    ttlSeconds: ACCESS_SECONDS,
    now,
    scope: MCP_SCOPE,
    // The family's id: ending the connection (revoking it) voids the access tokens it handed out.
    jti: family,
  });
  const refresh = await seal(
    REFRESH,
    {
      jti: toBase64Url(crypto.getRandomValues(new Uint8Array(16))),
      fam: family,
      sub: person,
      ws: context.workspace,
      cid: clientId,
      iat,
      exp: iat + REFRESH_DAYS * 24 * 60 * 60,
    },
    context.secret,
  );
  return Response.json(
    {
      access_token: access,
      token_type: "Bearer",
      expires_in: ACCESS_SECONDS,
      refresh_token: refresh,
      scope: MCP_SCOPE,
    },
    { headers: noStore },
  );
}

/** `POST /oauth/token`: a code and its PKCE verifier, or a refresh token, for an access token. */
export async function handleToken(request: Request, context: McpOAuthContext) {
  if (request.method !== "POST") return oauthError(405, "invalid_request", "Use POST.");
  const form = await request.formData().catch(() => undefined);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value : "";
  };
  const grant = field("grant_type");
  const invalid = (why: string) => oauthError(400, "invalid_grant", why);
  const nowSeconds = context.now().getTime() / 1000;

  if (grant === "authorization_code") {
    const claims = await unseal(CODE, field("code"), context.secret);
    if (!claims || claims.ws !== context.workspace) return invalid("This code is not valid.");
    const { sub, jti, ch, ru, cid, exp } = claims;
    if (typeof exp !== "number" || nowSeconds >= exp) return invalid("This code has expired.");
    if (typeof sub !== "string" || typeof jti !== "string")
      return invalid("This code is not valid.");
    if (cid !== field("client_id") || ru !== field("redirect_uri")) {
      return invalid("This code was issued to another app or address.");
    }
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(field("code_verifier"))),
    );
    if (ch !== toBase64Url(digest)) return invalid("The code_verifier does not match.");
    if (!(await context.registry.spendCode(jti, new Date(exp * 1000)))) {
      return invalid("This code was already used.");
    }
    if (!(await context.registry.findMember(context.workspace, sub))) {
      return invalid("This person is no longer in the workspace.");
    }
    return tokensFor(sub, String(cid), jti, context);
  }

  if (grant === "refresh_token") {
    const claims = await unseal(REFRESH, field("refresh_token"), context.secret);
    if (!claims || claims.ws !== context.workspace)
      return invalid("This refresh token is not valid.");
    const { sub, jti, fam, cid, iat, exp } = claims;
    if (
      typeof sub !== "string" ||
      typeof jti !== "string" ||
      typeof fam !== "string" ||
      typeof iat !== "number" ||
      typeof exp !== "number"
    ) {
      return invalid("This refresh token is not valid.");
    }
    if (nowSeconds >= exp) return invalid("This refresh token has expired.");
    if (cid !== field("client_id")) return invalid("This token was issued to another app.");
    if (await context.registry.isTokenRevoked(context.workspace, sub, fam, iat)) {
      return invalid("This connection was revoked.");
    }
    if (!(await context.registry.spendCode(jti, new Date(exp * 1000)))) {
      // A refresh token used twice: either the app or a thief holds a copy. End the connection.
      await context.registry.revokeToken(context.workspace, sub, fam, new Date(exp * 1000));
      return invalid("This refresh token was already used: the connection was ended.");
    }
    if (!(await context.registry.findMember(context.workspace, sub))) {
      return invalid("This person is no longer in the workspace.");
    }
    return tokensFor(sub, String(cid), fam, context);
  }
  return oauthError(400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
}

/** `POST /oauth/revoke` (RFC 7009): ends a refresh token's whole connection, or one access token. Always 200. */
export async function handleRevoke(request: Request, context: McpOAuthContext) {
  if (request.method !== "POST") return oauthError(405, "invalid_request", "Use POST.");
  const form = await request.formData().catch(() => undefined);
  const token = typeof form?.get("token") === "string" ? String(form!.get("token")) : "";
  const refresh = await unseal(REFRESH, token, context.secret);
  if (refresh && refresh.ws === context.workspace) {
    const { sub, fam, exp } = refresh;
    if (typeof sub === "string" && typeof fam === "string" && typeof exp === "number") {
      await context.registry.revokeToken(context.workspace, sub, fam, new Date(exp * 1000));
    }
  } else {
    const check = await verifyToken(token, {
      secret: context.secret,
      ...(context.previousSecrets ? { previousSecrets: context.previousSecrets } : {}),
      now: context.now(),
      scope: MCP_SCOPE,
    });
    if (check.ok && check.claims.jti) {
      await context.registry.revokeToken(
        context.workspace,
        check.claims.sub,
        check.claims.jti,
        new Date(check.claims.exp * 1000),
      );
    }
  }
  return new Response("{}", { headers: { "content-type": "application/json", ...noStore } });
}
