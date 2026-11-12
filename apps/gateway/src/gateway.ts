import {
  cliTokenRoute,
  closePreviewRoute,
  createDeployTokenRoute,
  deployRoute,
  issueTokenRoute,
  revokeTokenRoute,
  rollbackRoute,
  whoamiRoute,
} from "@forgeron/platform-contract";
import {
  handleAuthorize,
  handleRegister,
  handleRevoke,
  handleToken,
  metadata,
} from "./identity/mcp-oauth/mcp-oauth";
import { handleMySecrets } from "./my-secrets/my-secrets";
import { handleCliAuthorize } from "./identity/cli-login/cli";
import { handleUserSecrets } from "./dispatch/user-secrets";
import { workspaceOf } from "./dispatch/dispatch";
import {
  CONSOLE_API,
  createModules,
  createRequestModules,
  notFound,
  type GatewayOptions,
} from "./compose";
import type { GatewayEnv } from "./env";
import { GITHUB_PATHS } from "./platform/github";

export { gatewayBindingsOf, type GatewayEnv } from "./env";

/**
 * The platform routes outside `/console-api` that the Hono app answers (the contract's `bearer` module).
 * Read from the routes themselves: a path written here by hand was forgotten once (D-113).
 */
const BEARER_PATHS: ReadonlySet<string> = new Set([
  ...[
    whoamiRoute,
    createDeployTokenRoute,
    deployRoute,
    closePreviewRoute,
    rollbackRoute,
    issueTokenRoute,
    revokeTokenRoute,
    cliTokenRoute,
  ].map((route) => route.path),
  // The workspace's GitHub App (D-123): its creation, its installation and its webhook.
  ...GITHUB_PATHS,
]);

const CONSOLE_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

/**
 * The gateway's request handler. On a workspace origin: `/t/<tool>…` is dispatched to the tool,
 * `/auth/…`, `/whoami`, `/deploy`, `/rollback` and `/deploy-tokens` are the platform's, `/console-api/…` is the
 * console's API, and every other path is the console itself. One resolver (`createCaller`) turns a
 * session cookie or an audience-bound token into the person for all of them. The pieces are built
 * in `compose.ts`; this file is the table of routes.
 */
export function createGateway(env: GatewayEnv, options: GatewayOptions = {}) {
  const modules = createModules(env, options);

  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const workspace = workspaceOf(url.host, env.BASE_DOMAIN);
    const parts = await modules.parts();
    if (!workspace) return parts.dispatch(request);
    const asked = createRequestModules(modules, parts, request, workspace);

    // A preview address (`/t/<tool>@<branch>/secrets`) answers like the production one: a person's
    // secrets belong to the tool, not to an environment, so the branch is not part of the key (FOR-174).
    const secretsOf = /^\/t\/([a-z0-9-]+)(?:@[^/]+)?\/(?:secrets|setup)\/?$/.exec(url.pathname);
    if (secretsOf && asked.userSecrets) {
      return handleUserSecrets(request, secretsOf[1]!, asked.userSecrets());
    }
    if (url.pathname === "/t" || url.pathname.startsWith("/t/")) return parts.dispatch(request);

    // The routes the CLI and CI call (D-075): a Bearer token, or a session, and `{ error: { code, message } }`.
    const ownedByPlatform = () => modules.platform.fetch(request, asked.platformBindings("root"));

    // OAuth for MCP clients (D-094): the documents a client reads, then registration, the person's
    // answer, the token and the revocation. Without `AUTH_SECRET` they do not exist.
    if (parts.identity && asked.mcpOAuth) {
      const oauth = asked.mcpOAuth();
      const document = await metadata(request, oauth);
      if (document) return document;
      if (url.pathname === "/oauth/register") return handleRegister(request, oauth);
      if (url.pathname === "/oauth/authorize") return handleAuthorize(request, oauth);
      if (url.pathname === "/oauth/token") return handleToken(request, oauth);
      if (url.pathname === "/oauth/revoke") return handleRevoke(request, oauth);
    }

    // A person's own page of secrets (D-106): the session cookie only.
    if (parts.identity && asked.mySecrets && url.pathname === "/my/secrets") {
      return handleMySecrets(request, asked.mySecrets());
    }

    // The platform's own paths. Without `AUTH_SECRET` identity is off and they fail closed.
    if (parts.identity) {
      if (url.pathname.startsWith("/auth/")) {
        const answered = asked.emailAuth ? await asked.emailAuth()(request) : undefined;
        if (answered) return answered;
        if (url.pathname === "/auth/cli") return handleCliAuthorize(request, asked.cliLogin!());
        if (BEARER_PATHS.has(url.pathname)) return ownedByPlatform();
        return (await asked.auth!()(request)) ?? notFound(request);
      }
      if (BEARER_PATHS.has(url.pathname)) return ownedByPlatform();
    }

    if (url.pathname.startsWith(`${CONSOLE_API}/`)) {
      const inner = new URL(url);
      inner.pathname = url.pathname.slice(CONSOLE_API.length);
      const forwarded = new Request(inner, request);
      return modules.platform.fetch(forwarded, asked.platformBindings("console"));
    }

    // The admin MCP (sdk.md §17): POST only, so a GET still meets the JSON 404 below. Without
    // identity it does not exist, like the platform's own paths.
    if (url.pathname === "/mcp" && request.method === "POST" && asked.adminMcp) {
      return asked.adminMcp()(request);
    }

    // The workspace's own API paths belong to parts of the gateway that do not exist yet: never the
    // console, and JSON whatever the client accepts (sdk.md §7, Isolation point 1).
    if (/^\/(mcp|api|cli)(\/|$)/.test(url.pathname)) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Not found." } },
        { status: 404 },
      );
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return Response.json(
        { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } },
        { status: 405, headers: { allow: "GET, HEAD" } },
      );
    }
    if (!env.ASSETS) return notFound(request);
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set("content-security-policy", CONSOLE_CSP);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "same-origin");
    return new Response(asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  };
}
