import type { D1Database } from "@forgeron/hosting";
import {
  loadGatewayCode,
  createConsent,
  createIdentityConfig,
  createRegistry,
  createSecretBox,
  type IdentityConfig,
  type Registry,
  type SecretBox,
} from "@forgeron/registry";
import {
  createCloudflareClient,
  createCloudHosting,
  createGatewayBindings,
  createSelfHostHosting,
  GATEWAY_COMPATIBILITY_DATE,
  GATEWAY_COMPATIBILITY_FLAGS,
  type GatewayBindings,
  type Hosting,
} from "@forgeron/hosting";
import { handleConsent } from "./consent/consent";
import { handleConnections } from "./console-api/connections";
import { handleIdentity } from "./console-api/identity";
import { handleSecrets } from "./console-api/secrets";
import { handleSecretsStatus } from "./console-api/secrets-status";
import { handleTools } from "./console-api/tools";
import {
  createDispatcher,
  workspaceOf,
  type Caller,
  type DispatcherOptions,
} from "./dispatch/dispatch";
import { handleCreateDeployToken, handleDeploy } from "./deploy/deploy";
import { handlePromote, handleRollback } from "./deploy/promote";
import { handleGroups } from "./console-api/groups";
import { createAuth } from "./identity/auth";
import { createCaller, membership } from "./identity/caller";
import { providerFromConfig } from "./identity/presets";
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
  /**
   * The identity provider's issuer URL (OIDC, D-019). A provider an admin saved in the platform
   * (`/console-api/api/identity-provider`, D-035) wins over these; with neither, `/auth` answers 404.
   */
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
 * `/auth/…`, `/whoami`, `/deploy`, `/promote`, `/rollback` and `/deploy-tokens` are the platform's, `/console-api/…` is the
 * console's API, and every other path is the console itself. One resolver (`createCaller`) turns a
 * session cookie or an audience-bound token into the person for all of them. The pilot version
 * goes to the members of the pilot group at the production address (D-034).
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
  let built: Promise<{ registry: Registry; config: IdentityConfig; box?: SecretBox }> | undefined;
  const getBuilt = () =>
    (built ??= (async () => {
      const box = env.SECRETS_KEY ? await createSecretBox(env.SECRETS_KEY) : undefined;
      return {
        // One clock for the registry and the gateway: the expiry of a one-time code depends on it.
        registry: createRegistry(env.DB, { now, ...(box ? { secrets: box } : {}) }),
        config: createIdentityConfig(env.DB, { now, ...(box ? { secrets: box } : {}) }),
        ...(box ? { box } : {}),
      };
    })());
  const getRegistry = async () => (await getBuilt()).registry;

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
      // Pilot has the address of production: its group's members get it (D-034). Anonymous, or a
      // pilot with no group, nobody.
      ...(identify
        ? {
            inPilot: async (c: Caller & { group?: string }) => {
              if (!c.group) return false;
              const person = await identify(c);
              return person ? registry.isGroupMember(c.workspace, c.group, person) : false;
            },
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
    if (env.DISPATCHER && env.DISPATCH_NAMESPACE) {
      return createCloudHosting({ ...common, namespace: env.DISPATCH_NAMESPACE });
    }
    const gateway = gatewayBindingsOf(env);
    return createSelfHostHosting({ ...common, ...(gateway ? { gateway } : {}) });
  };

  const providerOf = async (workspace: string, config: IdentityConfig) => {
    const redirectUri = `https://${workspace}.${env.BASE_DOMAIN}/auth/callback`;
    const saved = await config.getIdentityProvider(workspace, env.SECRETS_KEY !== undefined);
    if (saved) return providerFromConfig(saved, redirectUri);
    return env.OIDC_ISSUER && env.OIDC_CLIENT_ID
      ? {
          issuer: env.OIDC_ISSUER,
          clientId: env.OIDC_CLIENT_ID,
          ...(env.OIDC_CLIENT_SECRET ? { clientSecret: env.OIDC_CLIENT_SECRET } : {}),
          redirectUri,
        }
      : undefined;
  };

  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const workspace = workspaceOf(url.host, env.BASE_DOMAIN);
    const { registry, caller, dispatch } = await parts();
    const { config, box } = await getBuilt();
    if (!workspace || url.pathname === "/t" || url.pathname.startsWith("/t/")) {
      return dispatch(request);
    }

    // The platform's own paths. Without `AUTH_SECRET` identity is off and they fail closed.
    if (secret && caller) {
      if (url.pathname.startsWith("/auth/")) {
        const auth = createAuth({
          baseDomain: env.BASE_DOMAIN,
          secret,
          providerFor: (ws) => providerOf(ws, config),
          resolvePerson: async (ws, identity) =>
            membership(registry, {
              ...(env.ADMIN_EMAIL ? { adminEmail: env.ADMIN_EMAIL } : {}),
              memberDomains: (env.MEMBER_EMAIL_DOMAINS ?? "")
                .split(",")
                .map((d) => d.trim().toLowerCase())
                .filter(Boolean),
              groupRoles: (await config.getIdentityProvider(ws))?.groupRoles ?? {},
            })(ws, identity),
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
      if (
        url.pathname === "/deploy" ||
        url.pathname === "/promote" ||
        url.pathname === "/rollback"
      ) {
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
        if (url.pathname === "/deploy") {
          return handleDeploy(request, { workspace, secret, now, registry, hosting });
        }
        const promotion = {
          workspace,
          secret,
          now,
          registry,
          hosting,
          authenticate: (r: Request) => caller.resolve(r, workspace, true),
        };
        return url.pathname === "/promote"
          ? handlePromote(request, promotion)
          : handleRollback(request, promotion);
      }
    }

    if (url.pathname.startsWith(`${CONSOLE_API}/`)) {
      const inner = new URL(url);
      inner.pathname = url.pathname.slice(CONSOLE_API.length);
      const forwarded = new Request(inner, request);
      const who = secret && caller ? await caller.resolve(request, workspace, true) : undefined;
      const identity = async () =>
        who
          ? {
              id: who.id,
              admin: who.roles.includes("admin"),
              developer: who.roles.includes("developer"),
            }
          : undefined;
      // A person's OAuth consent for a delegated connector (sdk.md §10): the OAuth clients are the
      // workspace's, set by an admin; tokens are sealed and never leave the registry.
      const consent =
        box && /\/consent(\/|$)/.test(inner.pathname)
          ? createConsent({
              registry,
              box,
              providers: Object.fromEntries(
                (await config.connectorClientsWithSecrets(workspace)).map((c) => [
                  c.connector,
                  {
                    authorizeUrl: c.authorizeUrl,
                    tokenUrl: c.tokenUrl,
                    clientId: c.clientId,
                    clientSecret: c.clientSecret,
                    redirectUri: `https://${workspace}.${env.BASE_DOMAIN}${CONSOLE_API}/api/consent/callback`,
                  },
                ]),
              ),
              fetch: async (u, init) => (options.fetch ?? fetch)(u, init),
              now,
            })
          : undefined;
      return (
        (await handleIdentity(forwarded, {
          config,
          workspace,
          canKeepSecrets: box !== undefined,
          caller: identity,
        })) ??
        (consent
          ? await handleConsent(forwarded, { registry, consent, workspace, caller: identity })
          : undefined) ??
        (await handleConnections(forwarded, { registry, workspace, caller: identity })) ??
        (await handleSecretsStatus(forwarded, { registry, workspace, caller: identity })) ??
        (await handleTools(forwarded, { registry, workspace, caller: identity })) ??
        (await handleGroups(forwarded, { registry, workspace, caller: identity })) ??
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

/**
 * Self-host: how the gateway adds and removes the `TOOL_<WORKER>` bindings of its own Worker
 * (D-029, D-032). It needs to know its own name (`GATEWAY_WORKER`, set by `platform install`) and
 * holds its code in the platform D1; without either, nothing is bound, as before.
 */
export function gatewayBindingsOf(env: GatewayEnv): GatewayBindings | undefined {
  if (
    typeof env.GATEWAY_WORKER !== "string" ||
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_API_TOKEN
  ) {
    return undefined;
  }
  return createGatewayBindings(
    createCloudflareClient({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
    }),
    {
      worker: env.GATEWAY_WORKER,
      // Everything the gateway holds now: carried over to the new version (`inherit`).
      bindings: () => Object.keys(env),
      code: async () => {
        const code = await loadGatewayCode(env.DB);
        if (code === undefined) {
          throw new Error(
            "The platform D1 holds no gateway code: run `forgeron platform install` again.",
          );
        }
        return code;
      },
      compatibilityDate: GATEWAY_COMPATIBILITY_DATE,
      compatibilityFlags: GATEWAY_COMPATIBILITY_FLAGS,
      keepAssets: env.ASSETS !== undefined,
    },
  );
}
