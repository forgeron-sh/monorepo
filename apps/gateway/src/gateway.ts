import type { D1Database } from "@forgeron/hosting";
import {
  loadGatewayAssets,
  loadGatewayCode,
  createConsent,
  createEmailCodes,
  createIdentityConfig,
  createSamlRequests,
  createRegistry,
  createSecretBox,
  type EmailCodes,
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
import { handleAccessMatrix } from "./console-api/access-matrix";
import { handleManifest } from "./console-api/manifest";
import { handleConnections } from "./console-api/connections";
import { handleIdentity } from "./console-api/identity";
import { handleMembers } from "./console-api/members";
import { handleSecrets } from "./console-api/secrets";
import { handleSecretsStatus } from "./console-api/secrets-status";
import { handleApprovals } from "./console-api/approvals";
import { handleAudit } from "./console-api/audit";
import { handleCatalog } from "./console-api/catalog";
import { handleTools } from "./console-api/tools";
import { handleWorkspace } from "./console-api/workspace";
import {
  createDispatcher,
  workspaceOf,
  type Caller,
  type DispatcherOptions,
} from "./dispatch/dispatch";
import { handleCreateDeployToken, handleDeploy } from "./deploy/deploy";
import { handlePromote, handleRollback } from "./deploy/promote";
import { createAuth } from "./identity/auth";
import { createEmailAuth } from "./identity/email-auth";
import { invitationId, invitationLink } from "./identity/invitation";
import { negotiated } from "./pages/errors";
import {
  cloudflareMailSender,
  consoleMailSender,
  type MailSender,
  type SendEmailBinding,
} from "./mail/mail";
import { createCaller, membership } from "./identity/caller";
import { providerFromConfig } from "./identity/presets";
import type { SamlProvider } from "./identity/saml";
import { handleCliAuthorize, handleCliToken } from "./identity/cli";
import { handleIssueToken, handleRevokeToken } from "./identity/issue";
import { handleRevocations } from "./console-api/revocations";
import { forwardIdentity, handleUserSecrets } from "./dispatch/user-secrets";
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
  /**
   * Rotation (D-035): the keys `AUTH_SECRET` replaced, comma-separated. Tokens they signed stay good
   * until they expire (30 days at most); drop them after that. Secret.
   */
  AUTH_SECRET_PREVIOUS?: string;
  /** Encrypts tool secrets and connection tokens at rest: 32 random bytes, base64. Secret. */
  SECRETS_KEY?: string;
  /**
   * The identity provider's issuer URL (OIDC, D-019). A provider an admin saved in the platform
   * (`/console-api/api/identity-provider`, D-041) wins over these; with neither, `/auth` answers 404.
   */
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  /** Secret. Optional: a public client uses PKCE alone. */
  OIDC_CLIENT_SECRET?: string;
  /** The email that becomes the administrator of a workspace at its first sign-in (D-027). */
  ADMIN_EMAIL?: string;
  /** Comma-separated email domains whose people become members at sign-in, with no role (D-027). */
  MEMBER_EMAIL_DOMAINS?: string;
  /**
   * How people sign in, comma-separated: `email` (D-049, needs `SEND_EMAIL` and `MAIL_FROM`) and/or
   * `oidc`. Unset: OIDC alone, as before. The sign-in page offers them in that order: the OIDC
   * button first, then the email form.
   */
  SIGN_IN_METHODS?: string;
  /** The `send_email` binding of Cloudflare Email Service that carries the sign-in codes. */
  SEND_EMAIL?: SendEmailBinding;
  /** The address the sign-in mail comes from: an address of a domain onboarded to Email Sending. */
  MAIL_FROM?: string;
  /**
   * `console` (D-051): the codes are written to the Worker's logs instead of being mailed, for test
   * installs. Opt-in; refused on the cloud (`DISPATCHER`, or a `forgeron.app` base domain).
   */
  MAIL_MODE?: string;
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

/** A page of the shell for a browser, the JSON error for any other client. */
const notFound = (request: Request) =>
  negotiated(
    request,
    404,
    Response.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 }),
  );

/**
 * The gateway's request handler. On a workspace origin: `/t/<tool>…` is dispatched to the tool,
 * `/auth/…`, `/whoami`, `/deploy`, `/promote`, `/rollback` and `/deploy-tokens` are the platform's, `/console-api/…` is the
 * console's API, and every other path is the console itself. One resolver (`createCaller`) turns a
 * session cookie or an audience-bound token into the person for all of them.
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
    /** Sends the sign-in mail; by default Cloudflare Email Sending through `SEND_EMAIL`. */
    mail?: MailSender;
    /** Runs work after the answer (`ctx.waitUntil`); without it the work is awaited. */
    defer?: (work: Promise<unknown>) => void;
  } = {},
) {
  const now = options.now ?? (() => new Date());
  const secret = env.AUTH_SECRET;
  const previousSecrets = (env.AUTH_SECRET_PREVIOUS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // The registry encrypts with `SECRETS_KEY` when it is bound, which is asynchronous: built once.
  let built:
    | Promise<{ registry: Registry; config: IdentityConfig; codes: EmailCodes; box?: SecretBox }>
    | undefined;
  const getBuilt = () =>
    (built ??= (async () => {
      const box = env.SECRETS_KEY ? await createSecretBox(env.SECRETS_KEY) : undefined;
      return {
        // One clock for the registry and the gateway: the expiry of a one-time code depends on it.
        registry: createRegistry(env.DB, { now, ...(box ? { secrets: box } : {}) }),
        config: createIdentityConfig(env.DB, { now, ...(box ? { secrets: box } : {}) }),
        codes: createEmailCodes(env.DB, { now }),
        ...(box ? { box } : {}),
      };
    })());

  const parts = async () => {
    const { registry, config, box, codes } = await getBuilt();
    // The consent exchange for a workspace, with the OAuth clients it is given (sdk.md §10).
    const consentFor = (
      workspace: string,
      clients: Awaited<ReturnType<IdentityConfig["connectorClientsWithSecrets"]>>,
      sealer: SecretBox,
    ) =>
      createConsent({
        registry,
        box: sealer,
        providers: Object.fromEntries(
          clients.map((c) => [
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
      });
    const caller = secret ? createCaller({ registry, secret, previousSecrets, now }) : undefined;
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
      // The person and their own per-person secrets go to the tool; a token for another tool stops here.
      ...(caller
        ? {
            forward: (c: Caller) =>
              forwardIdentity(
                c.tool,
                c.request,
                {
                  registry,
                  workspace: c.workspace,
                  identify: (r) => caller.identify(r, c.workspace),
                  ...(box
                    ? {
                        // Delegated connectors (D-046): the OAuth clients of the types the tool declares.
                        connectors: {
                          consent: async (types: string[]) =>
                            consentFor(
                              c.workspace,
                              await config.connectorClientsWithSecrets(c.workspace, types),
                              box,
                            ),
                          consentUrl: (tool: string, environment: string, name: string) =>
                            `https://${c.workspace}.${env.BASE_DOMAIN}${CONSOLE_API}/api/tools/${tool}/environments/${environment}/consent/${name}`,
                        },
                      }
                    : {}),
                },
                c.environment,
              ),
          }
        : {}),
      targets: (worker) =>
        env.DISPATCHER
          ? namespaceTarget(env.DISPATCHER, worker)
          : serviceBindingTarget(env, worker),
    });
    return { registry, config, box, codes, consentFor, caller, dispatch };
  };

  const hostingOf = (workspace: string): Hosting | undefined => {
    if (options.hosting) return options.hosting(workspace);
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return undefined;
    const common = {
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
      workspace,
      // Production answers at the tool's address; a preview adds `@<branch>` to it.
      url: (worker: string) =>
        `https://${workspace}.${env.BASE_DOMAIN}/t/${worker.split("--")[1] ?? ""}`,
    };
    if (env.DISPATCHER && env.DISPATCH_NAMESPACE) {
      return createCloudHosting({ ...common, namespace: env.DISPATCH_NAMESPACE });
    }
    const gateway = gatewayBindingsOf(env);
    return createSelfHostHosting({ ...common, ...(gateway ? { gateway } : {}) });
  };

  // The SAML provider an admin saved (D-050); it wins over any OIDC provider, saved or from bindings.
  const samlOf = async (
    workspace: string,
    config: IdentityConfig,
  ): Promise<SamlProvider | undefined> => {
    // Single sign-on is on when OIDC is (nothing stated, or `oidc` named) or when `saml` is named.
    if (!oidcOn && !methods.includes("saml")) return undefined;
    const saved = await config.getSamlProvider(workspace);
    if (!saved) return undefined;
    const origin = `https://${workspace}.${env.BASE_DOMAIN}`;
    return {
      idpEntityId: saved.idpEntityId,
      ssoUrl: saved.ssoUrl,
      certificates: saved.certificates,
      spEntityId: `${origin}/auth/saml/metadata`,
      acsUrl: `${origin}/auth/saml/acs`,
      ...(saved.emailAttribute ? { emailAttribute: saved.emailAttribute } : {}),
      ...(saved.groupsAttribute ? { groupsAttribute: saved.groupsAttribute } : {}),
      ...(saved.nameAttribute ? { nameAttribute: saved.nameAttribute } : {}),
    };
  };

  const methods = (env.SIGN_IN_METHODS ?? "")
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);
  // Console mail is for test installs: never where the gateway serves the cloud.
  const production =
    env.DISPATCHER !== undefined ||
    env.BASE_DOMAIN === "forgeron.app" ||
    env.BASE_DOMAIN.endsWith(".forgeron.app");
  const consoleMail = env.MAIL_MODE === "console" && !production;
  if (env.MAIL_MODE === "console" && production) {
    console.error("MAIL_MODE=console is refused on a production domain: sign-in by email is off.");
  }
  const mailer =
    options.mail ??
    (consoleMail
      ? consoleMailSender()
      : env.SEND_EMAIL && env.MAIL_FROM
        ? cloudflareMailSender(env.SEND_EMAIL, env.MAIL_FROM)
        : undefined);
  const emailOn = methods.includes("email") && mailer !== undefined;
  // OIDC stays on when nothing is stated (a gateway installed before D-049), or when it is named.
  const oidcOn = methods.length === 0 || methods.includes("oidc");
  const installDomains = (env.MEMBER_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  /** Who may join by themselves: what an admin saved, else what the install stated (D-049). */
  const policyOf = async (registry: Registry, workspace: string) => {
    const saved = await registry.getMembershipSettings(workspace);
    return {
      ...(env.ADMIN_EMAIL ? { adminEmail: env.ADMIN_EMAIL } : {}),
      domains: saved?.domains ?? installDomains,
      ...(saved?.defaultRole ? { defaultRole: saved.defaultRole } : {}),
    };
  };

  const providerOf = async (workspace: string, config: IdentityConfig) => {
    if (!oidcOn) return undefined;
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
    const { registry, config, box, codes, consentFor, caller, dispatch } = await parts();
    // Per-person secrets are typed at the gateway, never at the tool (D-036).
    const secretsOf = workspace ? /^\/t\/([a-z0-9-]+)\/secrets\/?$/.exec(url.pathname) : null;
    if (workspace && secretsOf && secret && caller) {
      return handleUserSecrets(request, secretsOf[1]!, {
        registry,
        workspace,
        // A CLI token may enter secrets: the route is the platform's own.
        identify: (r) => caller.identify(r, workspace, true),
      });
    }
    if (!workspace || url.pathname === "/t" || url.pathname.startsWith("/t/")) {
      return dispatch(request);
    }

    // The platform's own paths. Without `AUTH_SECRET` identity is off and they fail closed.
    if (secret && caller) {
      if (url.pathname.startsWith("/auth/")) {
        if (emailOn && mailer) {
          const emailAuth = createEmailAuth({
            baseDomain: env.BASE_DOMAIN,
            secret,
            registry,
            codes,
            mail: mailer,
            policy: (ws) => policyOf(registry, ws),
            // The "company account" button leads to `/auth/login?method=oidc`: SAML answers it too.
            oidcAvailable: async (ws) =>
              (await samlOf(ws, config)) !== undefined ||
              (await providerOf(ws, config)) !== undefined,
            now,
            sessionTtlSeconds: options.sessionTtlSeconds ?? 8 * 60 * 60,
            ...(consoleMail
              ? {
                  notice:
                    "Test mode: codes are written to the Worker's logs, so anyone who can read them can sign in as an allowed address.",
                }
              : {}),
            ...(options.defer ? { defer: options.defer } : {}),
          });
          const answered = await emailAuth(request);
          if (answered) return answered;
        }
        const auth = createAuth({
          baseDomain: env.BASE_DOMAIN,
          secret,
          providerFor: (ws) => providerOf(ws, config),
          samlFor: (ws) => samlOf(ws, config),
          samlRequests: createSamlRequests(env.DB),
          resolvePerson: async (ws, identity) =>
            (async () => {
              const policy = await policyOf(registry, ws);
              return membership(registry, {
                ...(policy.adminEmail ? { adminEmail: policy.adminEmail } : {}),
                memberDomains: policy.domains,
                ...(policy.defaultRole ? { defaultRole: policy.defaultRole } : {}),
                groupRoles:
                  (await config.getIdentityProvider(ws))?.groupRoles ??
                  (await config.getSamlProvider(ws))?.groupRoles ??
                  {},
              })(ws, identity);
            })(),
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
        if (url.pathname === "/auth/token/revoke") {
          return handleRevokeToken(request, {
            workspace,
            registry,
            now,
            person: (r) => caller.resolve(r, workspace, true),
          });
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
        return (await auth(request)) ?? notFound(request);
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
              roles: who.roles,
            }
          : undefined;
      // A person's OAuth consent for a delegated connector (sdk.md §10): the OAuth clients are the
      // workspace's, set by an admin; tokens are sealed and never leave the registry.
      const consent =
        box && /\/consent(\/|$)/.test(inner.pathname)
          ? consentFor(workspace, await config.connectorClientsWithSecrets(workspace), box)
          : undefined;
      return (
        (await handleIdentity(forwarded, {
          config,
          workspace,
          canKeepSecrets: box !== undefined,
          caller: identity,
          audit: (entry) => registry.recordAudit(entry),
        })) ??
        (await handleMembers(forwarded, {
          registry,
          workspace,
          installDomains,
          caller: identity,
          now,
          ...(mailer
            ? {
                notify: async (invitation) => {
                  await mailer.send({
                    to: invitation.email,
                    subject: `You are invited to ${workspace}`,
                    invitation: { roles: invitation.roles },
                    text: `You are invited to join ${workspace}${invitation.roles.length ? ` as ${invitation.roles.join(", ")}` : ""}.\n\nOpen ${invitationLink(`https://${workspace}.${env.BASE_DOMAIN}`, await invitationId(secret!, invitation))} to accept, then sign in with this email address. The invitation is valid until ${invitation.expiresAt.slice(0, 10)}.`,
                  });
                  return true;
                },
              }
            : {}),
        })) ??
        (consent
          ? await handleConsent(forwarded, { registry, consent, workspace, caller: identity })
          : undefined) ??
        (await handleRevocations(forwarded, {
          registry,
          workspace,
          caller: identity,
        })) ??
        (await handleConnections(forwarded, { registry, workspace, caller: identity })) ??
        (await handleAccessMatrix(forwarded, { registry, workspace, caller: identity })) ??
        (await handleSecretsStatus(forwarded, { registry, workspace, caller: identity })) ??
        (await handleManifest(forwarded, { registry, workspace, caller: identity })) ??
        (await handleTools(forwarded, { registry, workspace, caller: identity })) ??
        (await handleCatalog(forwarded, {
          registry,
          workspace,
          origin: `https://${workspace}.${env.BASE_DOMAIN}`,
          caller: identity,
        })) ??
        (await handleWorkspace(forwarded, {
          registry,
          workspace,
          endpoint: `https://${workspace}.${env.BASE_DOMAIN}`,
          baseDomain: env.BASE_DOMAIN,
          caller: async () => who,
          signIn: async () => ({
            email: { enabled: emailOn, mail: consoleMail ? "console" : mailer ? "email" : "off" },
            oidc: {
              enabled: oidcOn,
              configured: (await providerOf(workspace, config)) !== undefined,
            },
            saml: {
              enabled: oidcOn || methods.includes("saml"),
              configured: (await samlOf(workspace, config)) !== undefined,
            },
          }),
        })) ??
        (await handleApprovals(forwarded, { registry, workspace, caller: identity })) ??
        (await handleAudit(forwarded, { registry, workspace, caller: identity })) ??
        (await handleSecrets(forwarded, { registry, workspace, caller: identity })) ??
        notFound(request)
      );
    }

    // The workspace's own API paths belong to parts of the gateway that do not exist yet: never the console.
    if (/^\/(mcp|api|cli)(\/|$)/.test(url.pathname)) return notFound(request);

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
      // The console is served as assets (D-052): they are uploaded again with each new version.
      ...(env.ASSETS === undefined
        ? {}
        : {
            assets: async () => {
              const assets = await loadGatewayAssets(env.DB);
              if (assets === undefined) {
                throw new Error(
                  "The platform D1 holds no console assets: run `forgeron platform install` again.",
                );
              }
              return assets;
            },
          }),
    },
  );
}
