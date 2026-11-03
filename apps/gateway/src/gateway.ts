import type { D1Database } from "@forgeron/hosting";
import { createRegistry, createSecretBox, type Registry } from "@forgeron/registry";
import { createCloudHosting, createSelfHostHosting, type Hosting } from "@forgeron/hosting";
import { handleConnections } from "./console-api/connections";
import { handleSecrets } from "./console-api/secrets";
import { handleSecretsStatus } from "./console-api/secrets-status";
import { handleTools } from "./console-api/tools";
import { createDispatcher, workspaceOf, type DispatcherOptions } from "./dispatch/dispatch";
import { handleCreateDeployToken, handleDeploy } from "./deploy/deploy";
import { createAuth } from "./identity/auth";
import { createCaller, membership } from "./identity/caller";
import { handleCliAuthorize, handleCliToken } from "./identity/cli";
import { handleIssueToken } from "./identity/issue";
import { dispatchRegistry, type FromRegistryOptions } from "./dispatch/from-registry";
import { namespaceTarget, serviceBindingTarget, type DispatchNamespace } from "./dispatch/targets";

/** What the gateway Worker is given by its configuration (bindings to fill in `wrangler.jsonc`). */
export interface GatewayEnv {
  /** The platform D1. */
  DB: D1Database;
  /** `forgeron.app`. */
  BASE_DOMAIN: string;
  /**
   * Forgeron Cloud: the dispatch namespace the tool Workers are uploaded to (`dispatch_namespaces`
   * in `wrangler.jsonc`). Self-host has none and holds one service binding per Worker instead
   * (`TOOL_<WORKER>`, see `serviceBindingOf`): the gateway holds the only way to a tool.
   */
  DISPATCHER?: DispatchNamespace;
  /**
   * The built console (`apps/console/dist`, `assets` in `wrangler.jsonc`). It is the only app code
   * served at the workspace origin (sdk.md §7, "Isolation between tools on the same origin").
   */
  ASSETS?: { fetch(request: Request): Response | Promise<Response> };
  /**
   * Signs sessions, sign-in state and API/CLI/deployment tokens (HMAC). At least 32 random bytes,
   * base64. Secret. Without it nobody can sign in and every call is anonymous.
   */
  AUTH_SECRET?: string;
  /** Encrypts tool secrets and connection tokens at rest: 32 random bytes, base64. Secret. */
  SECRETS_KEY?: string;
  /** The identity provider's issuer URL (OIDC, D-019). Without these three, `/auth` answers 404. */
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  /** Secret. Optional: a public client uses PKCE alone. */
  OIDC_CLIENT_SECRET?: string;
  /** The email that becomes the administrator of a workspace at its first sign-in (D-027). */
  ADMIN_EMAIL?: string;
  /** Comma-separated email domains whose people become members at sign-in, with no role (D-027). */
  MEMBER_EMAIL_DOMAINS?: string;
  /** The Cloudflare account the gateway deploys tools to (`POST /deploy`). */
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** Secret. Limited to Workers, D1, KV and R2; deploys tools without the person present. */
  CLOUDFLARE_API_TOKEN?: string;
  /** Forgeron Cloud: the name of the dispatch namespace `DISPATCHER` is bound to. */
  DISPATCH_NAMESPACE?: string;
  /** The service bindings of self-host, and whatever else the Worker is given. */
  [binding: string]: unknown;
}

/** Where the console reads and writes on the workspace origin. */
const CONSOLE_API = "/console-api";

const CONSOLE_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

const notFound = () =>
  Response.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });

/**
 * The gateway's request handler. On a workspace origin: `/t/<tool>…` is dispatched to the tool,
 * `/auth/…`, `/whoami`, `/deploy` and `/deploy-tokens` are the platform's, `/console-api/…` is the
 * console's API, and every other path is the console itself. One resolver (`createCaller`) turns a
 * session cookie or an audience-bound token into the person for all of them. Nobody is in a pilot
 * group yet (no group data exists), so pilot is served to no one.
 */
export function createGateway(
  env: GatewayEnv,
  options: FromRegistryOptions & {
    identify?: DispatcherOptions["identify"];
    /** The clock, and the `fetch` the sign-in uses to reach the identity provider. */
    now?: () => Date;
    fetch?: typeof fetch;
    /** How long a session lives. */
    sessionTtlSeconds?: number;
    /** Where `POST /deploy` sends a build; by default the Cloudflare API with the bindings. */
    hosting?: (workspace: string) => Hosting | undefined;
  } = {},
) {
  const now = options.now ?? (() => new Date());
  const secret = env.AUTH_SECRET;

  // The registry encrypts with `SECRETS_KEY` when it is bound, which is asynchronous: built once.
  let built: Promise<Registry> | undefined;
  const getRegistry = () =>
    (built ??= (async () =>
      createRegistry(env.DB, {
        // One clock for the registry and the gateway: the expiry of a one-time code depends on it.
        now,
        ...(env.SECRETS_KEY ? { secrets: await createSecretBox(env.SECRETS_KEY) } : {}),
      }))());

  const parts = async () => {
    const registry = await getRegistry();
    const caller = secret ? createCaller({ registry, secret, now }) : undefined;
    const identify =
      options.identify ??
      (caller
        ? async (c: { workspace: string; request: Request }) =>
            (await caller.resolve(c.request, c.workspace))?.id
        : undefined);
    const dispatch = createDispatcher({
      baseDomain: env.BASE_DOMAIN,
      registry: dispatchRegistry(registry, options),
      // Seats are counted once identity tells who called (`identify`); without it nothing is counted.
      ...(identify
        ? {
            identify,
            recordSeat: (workspace: string, personId: string) =>
              registry.recordSeat(workspace, personId),
          }
        : {}),
      // A preview is for the workspace's administrators and developers (sdk.md §7).
      ...(caller
        ? {
            canPreview: async (c: { workspace: string; request: Request }) => {
              const roles = (await caller.resolve(c.request, c.workspace))?.roles ?? [];
              return roles.includes("admin") || roles.includes("developer");
            },
          }
        : {}),
      targets: (worker) =>
        env.DISPATCHER
          ? namespaceTarget(env.DISPATCHER, worker)
          : serviceBindingTarget(env, worker),
    });
    return { registry, caller, dispatch };
  };

  const hostingOf = (workspace: string): Hosting | undefined => {
    if (options.hosting) return options.hosting(workspace);
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return undefined;
    const common = {
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
      workspace,
      // Production and pilot answer at the tool's address; a preview adds `@<branch>` to it.
      url: (worker: string) =>
        `https://${workspace}.${env.BASE_DOMAIN}/t/${worker.split("--")[1] ?? ""}`,
    };
    return env.DISPATCHER && env.DISPATCH_NAMESPACE
      ? createCloudHosting({ ...common, namespace: env.DISPATCH_NAMESPACE })
      : createSelfHostHosting(common);
  };

  const providerOf = (workspace: string) =>
    env.OIDC_ISSUER && env.OIDC_CLIENT_ID
      ? {
          issuer: env.OIDC_ISSUER,
          clientId: env.OIDC_CLIENT_ID,
          ...(env.OIDC_CLIENT_SECRET ? { clientSecret: env.OIDC_CLIENT_SECRET } : {}),
          redirectUri: `https://${workspace}.${env.BASE_DOMAIN}/auth/callback`,
        }
      : undefined;

  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const workspace = workspaceOf(url.host, env.BASE_DOMAIN);
    const { registry, caller, dispatch } = await parts();
    if (!workspace || url.pathname === "/t" || url.pathname.startsWith("/t/")) {
      return dispatch(request);
    }

    // The platform's own paths. Without `AUTH_SECRET` identity is off and they fail closed.
    if (secret && caller) {
      if (url.pathname.startsWith("/auth/")) {
        const auth = createAuth({
          baseDomain: env.BASE_DOMAIN,
          secret,
          providerFor: providerOf,
          resolvePerson: membership(registry, {
            ...(env.ADMIN_EMAIL ? { adminEmail: env.ADMIN_EMAIL } : {}),
            memberDomains: (env.MEMBER_EMAIL_DOMAINS ?? "")
              .split(",")
              .map((d) => d.trim().toLowerCase())
              .filter(Boolean),
          }),
          fetch: options.fetch ?? fetch,
          now,
          sessionTtlSeconds: options.sessionTtlSeconds ?? 8 * 60 * 60,
        });
        if (url.pathname === "/auth/cli" || url.pathname === "/auth/cli/token") {
          const cli = {
            workspace,
            secret,
            registry,
            now,
            session: (r: Request) => caller.session(r, workspace),
          };
          return url.pathname === "/auth/cli"
            ? handleCliAuthorize(request, cli)
            : handleCliToken(request, cli);
        }
        if (url.pathname === "/auth/token") {
          return handleIssueToken(request, {
            workspace,
            secret,
            registry,
            now,
            session: (r) => caller.session(r, workspace),
          });
        }
        return (await auth(request)) ?? notFound();
      }
      if (url.pathname === "/whoami") {
        const person = await caller.resolve(request, workspace, true);
        return person
          ? Response.json({ ...person, workspace }, { headers: { "cache-control": "no-store" } })
          : Response.json(
              { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
              { status: 401 },
            );
      }
      if (url.pathname === "/deploy-tokens") {
        return handleCreateDeployToken(request, {
          workspace,
          secret,
          now,
          authenticate: (r) => caller.resolve(r, workspace, true),
        });
      }
      if (url.pathname === "/deploy") {
        const hosting = hostingOf(workspace);
        if (!hosting) {
          return Response.json(
            {
              error: {
                code: "NOT_CONFIGURED",
                message: "This gateway has no Cloudflare account to deploy to.",
              },
            },
            { status: 501 },
          );
        }
        return handleDeploy(request, { workspace, secret, now, registry, hosting });
      }
    }

    if (url.pathname.startsWith(`${CONSOLE_API}/`)) {
      const inner = new URL(url);
      inner.pathname = url.pathname.slice(CONSOLE_API.length);
      const forwarded = new Request(inner, request);
      const who = secret && caller ? await caller.resolve(request, workspace, true) : undefined;
      const identity = async () =>
        who
          ? { admin: who.roles.includes("admin"), developer: who.roles.includes("developer") }
          : undefined;
      return (
        (await handleConnections(forwarded, { registry, workspace, caller: identity })) ??
        (await handleSecretsStatus(forwarded, { registry, workspace, caller: identity })) ??
        (await handleTools(forwarded, { registry, workspace, caller: identity })) ??
        (await handleSecrets(forwarded, { registry, workspace, caller: identity })) ??
        notFound()
      );
    }

    // The workspace's own API paths belong to parts of the gateway that do not exist yet: never the console.
    if (/^\/(mcp|api|cli)(\/|$)/.test(url.pathname)) return notFound();

    if (request.method !== "GET" && request.method !== "HEAD") {
      return Response.json(
        { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } },
        { status: 405, headers: { allow: "GET, HEAD" } },
      );
    }
    if (!env.ASSETS) return notFound();
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
