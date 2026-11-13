import type { Registry } from "@forgeron/registry";
import { missingSetup } from "@forgeron/runtime";
import { libraryAccess, libraryPath, pilotAccess } from "../../library/library";
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
  registry: Pick<
    Registry,
    | "availabilityOf"
    | "currentManifest"
    | "findMember"
    | "findTool"
    | "isInstalled"
    | "isChannelInstalled"
    | "isTokenRevoked"
    | "channelAccessOf"
    | "readUserSecrets"
    | "readUserSetup"
    | "revokeToken"
    | "spendCode"
  >;
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

const TOOL_RESOURCE = /^\/t\/([a-z0-9][a-z0-9-]*)(@[^/]+|~[a-z][a-z0-9-]{0,29})?\/mcp$/;

/**
 * What an MCP client asks to be signed in to (`resource`, RFC 8707): the workspace's admin MCP, or
 * the MCP of one tool that exists in it, at its address with or without a preview branch (D-095).
 * The tool is `platform` for the admin MCP, which is the audience of its tokens (D-094).
 */
async function resourceOf(
  resource: string,
  context: McpOAuthContext,
): Promise<{ tool: string; url: string; branch?: string } | undefined> {
  if (resource === `${context.origin}/mcp`) return { tool: PLATFORM_TOOL, url: resource };
  if (!resource.startsWith(`${context.origin}/`)) return undefined;
  const found = TOOL_RESOURCE.exec(resource.slice(context.origin.length));
  const tool = found?.[1];
  // `platform` is the audience of the admin MCP: a tool of that name must never share it.
  if (!tool || tool === PLATFORM_TOOL) return undefined;
  if (!(await context.registry.findTool(context.workspace, tool))) return undefined;
  // `@<branch>` is a temporary channel, `~<name>` a permanent one (D-125): the reference keeps `~`.
  const suffix = found?.[2];
  const branch = suffix?.startsWith("~") ? suffix : suffix?.slice(1);
  return { tool, url: resource, ...(branch ? { branch } : {}) };
}

/** The documents a client reads to find out how to sign in (RFC 9728 and RFC 8414). */
export async function metadata(
  request: Request,
  context: McpOAuthContext,
): Promise<Response | undefined> {
  const path = new URL(request.url).pathname;
  const headers = { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" };
  if (request.method !== "GET") return undefined;
  const prefix = "/.well-known/oauth-protected-resource";
  // A tool's MCP has its own document: `/.well-known/oauth-protected-resource/t/<tool>/mcp` (RFC 9728).
  if (path.startsWith(`${prefix}/t/`)) {
    const asked = await resourceOf(`${context.origin}${path.slice(prefix.length)}`, context);
    if (!asked) return undefined;
    return Response.json(
      {
        resource: asked.url,
        authorization_servers: [context.origin],
        bearer_methods_supported: ["header"],
        scopes_supported: [MCP_SCOPE],
        resource_name: `${asked.tool} on ${context.workspace}`,
      },
      { headers },
    );
  }
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
 * Does this person still have something to give the tool before it works (D-097, D-098)? A tool with
 * no published version, or no setup, asks nothing. A registry without a secret key cannot hold their
 * secrets, so none counts as set.
 */
async function setupIncomplete(
  tool: string,
  person: Person,
  context: McpOAuthContext,
): Promise<boolean> {
  const record = await context.registry.findTool(context.workspace, tool);
  if (!record) return false;
  let manifest;
  try {
    manifest = await context.registry.currentManifest(record.id);
  } catch {
    return false;
  }
  const secrets = await context.registry.readUserSecrets(record.id, person.id).catch(() => ({}));
  const setup = await context.registry.readUserSetup(record.id, person.id);
  const missing = missingSetup(manifest, { setup, secrets });
  return missing.fields.length > 0 || missing.secrets.length > 0;
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
  const target = await resourceOf(resource ?? `${context.origin}/mcp`, context);
  if (!target) return bad("This workspace has no MCP at that address.");
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
  // A tool with a rule is signed in to only by the people who added it to their library (D-117): the
  // others are sent there, where they add it and come back.
  if (target.tool !== PLATFORM_TOOL) {
    const record = await context.registry.findTool(context.workspace, target.tool);
    // The MCP of a channel other than production (`/t/<tool>@<branch>/mcp`, `/t/<tool>~<name>/mcp`)
    // is reached by the people who added that channel (D-119, D-125).
    const reach = !record
      ? "ok"
      : target.branch !== undefined
        ? (await pilotAccess(context.registry, record.id, target.branch, person))
          ? "ok"
          : "unavailable"
        : await libraryAccess(context.registry, record.id, person);
    if (reach === "unavailable") {
      return errorPage(403, {
        workspace: context.workspace,
        detail: "This tool is not available to you. Ask someone who can give access.",
      });
    }
    if (reach === "not-installed") {
      if (posting) return bad("Add this tool to your library first, then allow the app.");
      return new Response(null, {
        status: 302,
        headers: { location: libraryPath(target.tool) },
      });
    }
  }
  // The tool's setup comes before the click: what the person must give is asked on the web, at the
  // tool's setup page, which sends them back here when they are done (D-098). A POST that skips it
  // is refused too, so a token is never issued for a tool the person has not set up.
  if (target.tool !== PLATFORM_TOOL && (await setupIncomplete(target.tool, person, context))) {
    if (posting) {
      return bad("Finish this tool's setup first, then allow the app.");
    }
    const here = `${url.pathname}${url.search}`;
    return new Response(null, {
      status: 302,
      headers: {
        location: `/t/${target.tool}/setup?next=${encodeURIComponent(here)}`,
      },
    });
  }
  const back = new URL(redirectUri);
  if (!posting) {
    return consentPage({
      workspace: context.workspace,
      person,
      clientName: client.name,
      ...(target.tool === PLATFORM_TOOL ? {} : { tool: target.tool }),
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
      res: target.url,
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
  resource: string,
  context: McpOAuthContext,
) {
  const tool = (await resourceOf(resource, context))?.tool;
  if (!tool) return oauthError(400, "invalid_target", "That MCP no longer exists here.");
  const now = context.now();
  const iat = Math.floor(now.getTime() / 1000);
  const access = await issueToken({
    secret: context.secret,
    person,
    workspace: context.workspace,
    tool,
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
      res: resource,
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
    const { sub, jti, ch, ru, cid, exp, res } = claims;
    if (typeof exp !== "number" || nowSeconds >= exp) return invalid("This code has expired.");
    if (typeof sub !== "string" || typeof jti !== "string")
      return invalid("This code is not valid.");
    if (cid !== field("client_id") || ru !== field("redirect_uri")) {
      return invalid("This code was issued to another app or address.");
    }
    if (typeof res !== "string") return invalid("This code is not valid.");
    // RFC 8707: a `resource` sent here must be the one the person allowed.
    if (field("resource") && field("resource") !== res) {
      return oauthError(400, "invalid_target", "This code was issued for another MCP.");
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
    return tokensFor(sub, String(cid), jti, res, context);
  }

  if (grant === "refresh_token") {
    const claims = await unseal(REFRESH, field("refresh_token"), context.secret);
    if (!claims || claims.ws !== context.workspace)
      return invalid("This refresh token is not valid.");
    const { sub, jti, fam, cid, iat, exp, res } = claims;
    if (
      typeof sub !== "string" ||
      typeof jti !== "string" ||
      typeof fam !== "string" ||
      typeof iat !== "number" ||
      typeof exp !== "number" ||
      typeof res !== "string"
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
    return tokensFor(sub, String(cid), fam, res, context);
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
