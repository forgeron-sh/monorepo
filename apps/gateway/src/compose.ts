import type { SetupCheckResult } from "@forgeron/runtime";
import { pilotAccess } from "./library/library";
import {
  createConsent,
  createEmailCodes,
  createIdentityConfig,
  createReseal,
  createSamlRequests,
  createRegistry,
  createSecretBox,
  reachesChannelAlways,
  type EmailCodes,
  type IdentityConfig,
  type Invitation,
  type Registry,
  type SecretBox,
  VIA_FORGERON_MCP,
} from "@forgeron/registry";
import { createAdminMcp } from "./admin-mcp/server";
import { createCloudHosting, createSelfHostHosting, type Hosting } from "@forgeron/hosting";
import { gatewayBindingsOf, type GatewayEnv } from "./env";
import type { PlatformBindings } from "./platform/app";
import { createPlatform } from "./platform/platform";
import { createPlatformUpdates } from "./platform-update/update";
import { GATEWAY_COMMIT, GATEWAY_VERSION } from "./version";
import {
  createDispatcher,
  createToolCaller,
  type Caller,
  type DispatcherOptions,
} from "./dispatch/dispatch";
import { createAuth } from "./identity/sign-in/auth";
import { createEmailAuth } from "./identity/sign-in/email-auth";
import { invitationId, invitationLink } from "./identity/sign-in/invitation";
import { negotiated } from "./pages/errors";
import { cloudflareMailSender, consoleMailSender, type MailSender } from "./mail/mail";
import { createCaller, membership } from "./identity/authn/caller";
import { providerFromConfig } from "./identity/sign-in/presets";
import type { SamlProvider } from "./identity/sign-in/saml";
import type { Person } from "./kernel/person";
import { forwardIdentity, wireUser } from "./dispatch/user-secrets";
import { VIEW_ASSET_SCOPE, serveView } from "./views/serve";
import { audienceOf } from "./identity/authn/audience";
import { verifyToken } from "./identity/authn/tokens";
import { CONTEXT_HEADER, type RoomContext } from "./realtime/room";
import type { Manifest } from "@forgeron/manifest";
import { dispatchRegistry, type FromRegistryOptions } from "./dispatch/from-registry";
import { namespaceTarget, serviceBindingTarget } from "./dispatch/targets";
import { toolAddress } from "./tool-address";
import { workspaceHosts } from "./kernel/workspace";

// The composition of the gateway (D-077). `createModules` builds what lives as long as the Worker:
// the registry and the identity pieces, once. `createRequestModules` builds what lives as long as one
// request: the person (looked up at most once, and only when a route asks) and the context each area
// is handed. An area is given the narrow port it uses, never the whole of what is built here.

/** Where the console reads and writes on the workspace origin. */
export const CONSOLE_API = "/console-api";

/** The room of a tool's channel: one per workspace, tool and channel (D-135). */
const roomName = (workspace: string, tool: string, branch?: string) =>
  `${workspace}/${tool}${branch === undefined ? "" : `@${branch}`}`;

/**
 * The build a channel runs (D-134): production, a permanent channel (`~name`) or a branch's temporary
 * channel (`branch`). `undefined` when nothing is deployed there.
 */
async function servedBuild(
  registry: Pick<Registry, "listEnvironments" | "getVersion" | "getBuild">,
  toolId: string,
  reference: string | undefined,
) {
  const environments = await registry.listEnvironments(toolId);
  const environment = environments.find((e) =>
    reference === undefined
      ? e.name === "production"
      : reference.startsWith("~")
        ? e.name === "channel" && e.channel === reference.slice(1)
        : e.name === "preview" && e.branch === reference,
  );
  const version = environment?.versionId
    ? await registry.getVersion(environment.versionId)
    : undefined;
  return version ? registry.getBuild(version.buildId) : undefined;
}

/** A page of the shell for a browser, the JSON error for any other client. */
export const notFound = (request: Request) =>
  negotiated(
    request,
    404,
    Response.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 }),
  );

export type GatewayOptions = FromRegistryOptions & {
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
};

/** What lives as long as the Worker. */
export function createModules(env: GatewayEnv, options: GatewayOptions) {
  const now = options.now ?? (() => new Date());
  // The platform API as one Hono app (D-064): built once, the person comes with each request.
  const platform = createPlatform();
  const secret = env.AUTH_SECRET;
  const listOf = (value: string | undefined) =>
    (value ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  const previousSecrets = listOf(env.AUTH_SECRET_PREVIOUS);

  const methods = (env.SIGN_IN_METHODS ?? "")
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);
  // Console mail is for test installs: never where the gateway serves the cloud.
  const production =
    env.DISPATCHER !== undefined ||
    env.BASE_DOMAIN === "forgeron.app" ||
    (env.BASE_DOMAIN ?? "").endsWith(".forgeron.app");
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

  // The registry encrypts with `SECRETS_KEY` when it is bound, which is asynchronous: built once.
  let built:
    | Promise<{
        registry: Registry;
        config: IdentityConfig;
        codes: EmailCodes;
        box?: SecretBox;
        resealer?: ReturnType<typeof createReseal>;
      }>
    | undefined;
  const getBuilt = () =>
    (built ??= (async () => {
      const box = env.SECRETS_KEY
        ? await createSecretBox(env.SECRETS_KEY, listOf(env.SECRETS_KEY_PREVIOUS))
        : undefined;
      return {
        // One clock for the registry and the gateway: the expiry of a one-time code depends on it.
        registry: createRegistry(env.DB, { now, ...(box ? { secrets: box } : {}) }),
        config: createIdentityConfig(env.DB, { now, ...(box ? { secrets: box } : {}) }),
        codes: createEmailCodes(env.DB, { now }),
        ...(box ? { box, resealer: createReseal(env.DB, box) } : {}),
      };
    })());

  // The platform updating itself (D-138): built once, it keeps the latest release in memory.
  const updates = createPlatformUpdates({
    env,
    fetch: () => options.fetch ?? fetch,
    now,
    ...(options.defer ? { defer: options.defer } : {}),
    current: { version: GATEWAY_VERSION, ...(GATEWAY_COMMIT ? { commit: GATEWAY_COMMIT } : {}) },
    gateway: (fetcher) => gatewayBindingsOf(env, { fetch: fetcher }),
  });

  // Which workspace a host serves, and each workspace's primary origin (D-126).
  const hosts = workspaceHosts(env);
  /**
   * The primary origin of a workspace. A workspace served only as the default workspace, with no
   * mapped host and no base domain, has none: the origin of the request stands in for it.
   */
  const originOf = (workspace: string, request?: Request): string =>
    hosts.primaryOrigin(workspace) ?? (request ? new URL(request.url).origin : "");

  const hostingOf = (workspace: string, request?: Request): Hosting | undefined => {
    if (options.hosting) return options.hosting(workspace);
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return undefined;
    const origin = originOf(workspace, request);
    const common = {
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
      // The tools' databases are created in the platform's region (D-141).
      ...(env.PLATFORM_D1_ID ? { d1NearDatabase: env.PLATFORM_D1_ID } : {}),
      workspace,
      // Production answers at the tool's address; a preview adds `@<branch>`, another permanent
      // channel `~<name>` (D-125).
      url: (worker: string, environment: { branch?: string; channel?: string }) =>
        toolAddress(origin, worker, environment),
    };
    if (env.DISPATCHER && env.DISPATCH_NAMESPACE) {
      return createCloudHosting({ ...common, namespace: env.DISPATCH_NAMESPACE });
    }
    const gateway = gatewayBindingsOf(env);
    return createSelfHostHosting({ ...common, ...(gateway ? { gateway } : {}) });
  };

  // The SAML provider saved (D-050); it wins over any OIDC provider, saved or from bindings.
  const samlOf = async (
    workspace: string,
    config: IdentityConfig,
    request?: Request,
  ): Promise<SamlProvider | undefined> => {
    // Single sign-on is on when OIDC is (nothing stated, or `oidc` named) or when `saml` is named.
    if (!oidcOn && !methods.includes("saml")) return undefined;
    const saved = await config.getSamlProvider(workspace);
    if (!saved) return undefined;
    const origin = originOf(workspace, request);
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

  /** Who may join by themselves: what was saved in the console, else what the install stated (D-049). */
  const policyOf = async (registry: Pick<Registry, "getMembershipSettings">, workspace: string) => {
    const saved = await registry.getMembershipSettings(workspace);
    return {
      ...(env.ADMIN_EMAIL ? { adminEmail: env.ADMIN_EMAIL } : {}),
      domains: saved?.domains ?? installDomains,
      ...(saved?.defaultTeams.length ? { defaultTeams: saved.defaultTeams } : {}),
    };
  };

  const providerOf = async (workspace: string, config: IdentityConfig, request?: Request) => {
    if (!oidcOn) return undefined;
    const redirectUri = `${originOf(workspace, request)}/auth/callback`;
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

  /** The pieces that need the registry (asynchronous when `SECRETS_KEY` is bound): built once. */
  const parts = async () => {
    const { registry, config, box, codes, resealer } = await getBuilt();
    // The consent exchange for a workspace, with the OAuth clients it is given (sdk.md §10).
    const consentFor = (
      workspace: string,
      clients: Awaited<ReturnType<IdentityConfig["connectorClientsWithSecrets"]>>,
      sealer: SecretBox,
      origin: string,
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
              redirectUri: `${origin}${CONSOLE_API}/api/consent/callback`,
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
    const dispatchRegistryOf = dispatchRegistry(registry, options);
    const targetOf = (worker: string) =>
      env.DISPATCHER ? namespaceTarget(env.DISPATCHER, worker) : serviceBindingTarget(env, worker);
    const forwardFor = (c: Caller) =>
      caller
        ? forwardIdentity(
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
                          originOf(c.workspace, c.request),
                        ),
                      consentUrl: (tool: string, environment: string, name: string) =>
                        `${originOf(c.workspace, c.request)}${CONSOLE_API}/api/tools/${tool}/environments/${environment}/consent/${name}`,
                    },
                  }
                : {}),
            },
            c.environment,
            c.branch,
          )
        : Promise.resolve(undefined);
    const dispatch = createDispatcher({
      workspaceOf: hosts.workspaceOf,
      registry: dispatchRegistryOf,
      // Seats are counted once identity tells who called (`identify`); without it nothing is counted.
      ...(identify
        ? {
            identify,
            recordSeat: (workspace: string, personId: string) =>
              registry.recordSeat(workspace, personId),
            recordUsage: (workspace: string, tool: string, personId: string) =>
              registry.recordUsage(workspace, tool, personId),
          }
        : {}),
      // A preview is for who holds `tools:read` or `tools:publish` (sdk.md §7, D-137), and for the people
      // the branch was opened to who added it to their library: a pilot (D-119).
      ...(caller
        ? {
            canPreview: async (c: {
              workspace: string;
              tool: string;
              branch: string;
              request: Request;
            }) => {
              const person = await caller.resolve(c.request, c.workspace);
              if (!person) return false;
              if (reachesChannelAlways(c.branch, person)) return true;
              const tool = await registry.findTool(c.workspace, c.tool);
              return tool ? pilotAccess(registry, tool.id, c.branch, person) : false;
            },
          }
        : {}),
      // The scripts of a page on a channel other than production: the token the page was served with (D-134).
      ...(secret
        ? {
            viewAsset: async (a: { workspace: string; tool: string; token: string }) =>
              (
                await verifyToken(a.token, {
                  secret,
                  previousSecrets,
                  now: now(),
                  audience: audienceOf(a.workspace, a.tool),
                  scope: VIEW_ASSET_SCOPE,
                })
              ).ok,
          }
        : {}),
      // The pages of a tool (D-134): served from the build the channel runs, with the sandbox CSP and a
      // short-lived token bound to the tool and the person.
      ...(caller && secret
        ? {
            views: async ({
              caller: c,
              request,
              rest,
              branch,
            }: {
              caller: Caller;
              request: Request;
              rest: string;
              branch?: string;
            }) => {
              if (request.method !== "GET" && request.method !== "HEAD") return undefined;
              const tool = await registry.findTool(c.workspace, c.tool);
              if (!tool) return undefined;
              const build = await servedBuild(registry, tool.id, branch);
              if (!build?.views) return undefined;
              const manifest = build.manifest as Manifest;
              // The tool's root opens its first page when the tool has none at `/`.
              const pages = Object.values(manifest.views ?? {});
              if (rest === "/" && !pages.some((v) => v.path === "/") && pages[0]) {
                const base = new URL(request.url).pathname.replace(/\/+$/, "");
                return Response.redirect(new URL(`${base}${pages[0].path}`, request.url), 302);
              }
              const person = await caller.resolve(request, c.workspace);
              const matrix = person
                ? await registry.accessFor(tool.id, person.subjects)
                : { access: {}, permissions: {} };
              const files = build.views;
              return serveView(
                new Request(new URL(rest, request.url), { method: request.method }),
                {
                  secret,
                  now: now(),
                  workspace: c.workspace,
                  tool: c.tool,
                  // `/t/crm`, `/t/crm@feat-x`, `/t/crm~staging`: where the tool is on the workspace origin.
                  base: /^\/t\/[^/]+/.exec(new URL(request.url).pathname)?.[0] ?? `/t/${c.tool}`,
                  // Its scripts are asked for without a cookie: the token in their address says who may.
                  assetToken: branch !== undefined,
                  manifest,
                  access: matrix.access,
                  permissions: matrix.permissions,
                  person,
                  assets: {
                    read: async (file) =>
                      file in files
                        ? { body: files[file]!, contentType: "text/javascript; charset=utf-8" }
                        : undefined,
                  },
                },
              );
            },
          }
        : {}),
      // The person and their own per-person secrets go to the tool; a token for another tool stops here.
      ...(caller ? { forward: forwardFor } : {}),
      // Realtime (D-135): a page's WebSocket goes to the room of the tool's channel, and what actions
      // published goes there too. Both need the room's Durable Object (`REALTIME`).
      ...(caller && secret && env.REALTIME
        ? {
            realtime: async ({
              caller: c,
              request,
              environment,
              branch,
              worker,
            }: {
              caller: Caller;
              request: Request;
              environment: "preview" | "production";
              branch?: string;
              worker: string;
            }) => {
              // A browser cannot set a header on a WebSocket: the page's token comes in the address.
              const token = new URL(request.url).searchParams.get("token");
              const unauthenticated = () =>
                Response.json(
                  {
                    error: {
                      code: "UNAUTHENTICATED",
                      message: "Sign in to follow this tool live.",
                    },
                  },
                  { status: 401 },
                );
              if (!token) return unauthenticated();
              const forwarding = await forwardFor({
                ...c,
                request: new Request(request.url, {
                  headers: { authorization: `Bearer ${token}` },
                }),
                environment,
                ...(branch !== undefined ? { branch } : {}),
              });
              if (!forwarding) return unauthenticated();
              if ("refuse" in forwarding) return forwarding.refuse;
              const user = JSON.parse(forwarding.headers["x-forgeron-user"] ?? "null") as
                | RoomContext["user"]
                | null;
              if (!user?.id) return unauthenticated();
              const tool = await registry.findTool(c.workspace, c.tool);
              const build = tool ? await servedBuild(registry, tool.id, branch) : undefined;
              const manifest = build?.manifest as Manifest | undefined;
              if (!manifest?.realtime) {
                return Response.json(
                  { error: { code: "NOT_FOUND", message: "This tool has no realtime." } },
                  { status: 404 },
                );
              }
              const context: RoomContext = {
                user,
                manifest: { profiles: manifest.profiles, realtime: manifest.realtime },
                worker,
              };
              const room = env.REALTIME!.get(
                env.REALTIME!.idFromName(roomName(c.workspace, c.tool, branch)),
              );
              return room.fetch(
                new Request("https://room/connect", {
                  headers: { upgrade: "websocket", [CONTEXT_HEADER]: JSON.stringify(context) },
                }),
              );
            },
            publish: async (
              c: Caller & { environment: "preview" | "production" },
              messages: unknown[],
            ) => {
              const room = env.REALTIME!.get(
                env.REALTIME!.idFromName(roomName(c.workspace, c.tool, c.branch)),
              );
              await room.fetch(
                new Request("https://room/publish", {
                  method: "POST",
                  body: JSON.stringify(messages),
                }),
              );
            },
          }
        : {}),
      targets: targetOf,
    });
    return {
      registry,
      config,
      box,
      resealer,
      codes,
      consentFor,
      dispatch,
      /** The gateway's own call to a tool's Worker (the check of a setup, D-101). */
      callTool: createToolCaller({ registry: dispatchRegistryOf, targets: targetOf }),
      // Set where identity is on (`AUTH_SECRET`): without it the platform's own paths fail closed.
      identity: secret && caller ? { secret, caller } : undefined,
    };
  };

  return {
    env,
    options,
    now,
    platform,
    updates,
    parts,
    hosts,
    originOf,
    hostingOf,
    mailer,
    consoleMail,
    emailOn,
    oidcOn,
    methods,
    installDomains,
    samlOf,
    policyOf,
    providerOf,
  };
}

export type Modules = ReturnType<typeof createModules>;
type Parts = Awaited<ReturnType<Modules["parts"]>>;

/** What lives as long as one request to a workspace origin. */
export function createRequestModules(
  modules: Modules,
  parts: Parts,
  request: Request,
  workspace: string,
) {
  const { env, options, now, mailer } = modules;
  const { registry, config, box, codes, consentFor, identity, resealer } = parts;
  // The primary origin (D-126): what is mailed, shown and checked. The request may come on another host.
  const origin = modules.originOf(workspace, request);

  // The person comes lazily and at most once: a route that is public, or refused before anyone is
  // asked, never costs a lookup. A CLI token counts: these are the platform's own routes.
  let who: Promise<Person | undefined> | undefined;
  const whoIs = () =>
    (who ??= identity
      ? identity.caller.resolve(request, workspace, true)
      : Promise.resolve(undefined));
  const personOfRequest = whoIs;

  // Tells an invited address where to sign in (best effort: the answer says whether it went).
  const notify = mailer
    ? async (invitation: Invitation) => {
        await mailer.send({
          to: invitation.email,
          subject: `You are invited to ${workspace}`,
          invitation: { teams: invitation.teams },
          text: `You are invited to join ${workspace}${invitation.teams.length ? `, in the teams ${invitation.teams.join(", ")}` : ""}.\n\nOpen ${invitationLink(origin, await invitationId(identity!.secret, invitation))} to accept, then sign in with this email address. The invitation is valid until ${invitation.expiresAt.slice(0, 10)}.`,
        });
        return true;
      }
    : undefined;

  // Tells a person that someone set one of their secrets (D-111): a short mail with no value.
  const notifySecretSet = mailer
    ? async (person: string, toolName: string, field: string) => {
        const member = await registry.findMember(workspace, person);
        if (!member) return false;
        await mailer.send({
          to: member.email,
          subject: `Someone set a secret for you in ${workspace}`,
          notice: "secret set by someone else",
          text: `Someone who manages the tools of ${workspace} set your secret ${field} for the tool ${toolName}.\n\nYou can see it, change it or delete it on ${origin}/my/secrets. The value is never shown. If you did not expect this, tell the people who administer ${workspace}.`,
        });
        return true;
      }
    : undefined;

  /** What the platform app needs from this gateway for this request. */
  const platformBindings = (
    surface: "console" | "root",
    whoIs: () => Promise<Person | undefined> = personOfRequest,
  ): PlatformBindings => ({
    surface,
    notFound: () => notFound(request),
    // A person's OAuth consent for a delegated connector (sdk.md §10): the OAuth clients are the
    // workspace's, set by someone who holds `settings:write`; tokens are sealed and never leave the registry.
    ...(box
      ? {
          consent: async () =>
            consentFor(workspace, await config.connectorClientsWithSecrets(workspace), box, origin),
        }
      : {}),
    identity: async () => {
      const person = await whoIs();
      return person
        ? {
            id: person.id,
            email: person.email,
            name: person.name,
            teams: person.teams,
            permissions: person.permissions,
          }
        : undefined;
    },
    registry,
    workspace,
    installDomains: modules.installDomains,
    config,
    canKeepSecrets: box !== undefined,
    ...(resealer ? { reseal: () => resealer.resealSecrets(workspace) } : {}),
    now,
    ...(notify ? { notify } : {}),
    ...(notifySecretSet ? { notifySecretSet } : {}),
    origin,
    ...(env.BASE_DOMAIN ? { baseDomain: env.BASE_DOMAIN } : {}),
    marketplaceFetch: async (u, init) => (options.fetch ?? fetch)(u, init),
    githubFetch: async (u, init) => (options.fetch ?? fetch)(u, init),
    ...(env.OFFICIAL_MARKETPLACE ? { officialMarketplace: env.OFFICIAL_MARKETPLACE } : {}),
    hosting: (ws: string) => modules.hostingOf(ws, request),
    update: modules.updates.of(registry),
    ...(identity
      ? {
          bearer: {
            secret: identity.secret,
            person: whoIs,
            session: () => identity.caller.session(request, workspace),
          },
        }
      : {}),
    signIn: async () => ({
      email: {
        enabled: modules.emailOn,
        mail: modules.consoleMail ? "console" : mailer ? "email" : "off",
      },
      oidc: {
        enabled: modules.oidcOn,
        configured: (await modules.providerOf(workspace, config, request)) !== undefined,
      },
      saml: {
        enabled: modules.oidcOn || modules.methods.includes("saml"),
        configured: (await modules.samlOf(workspace, config, request)) !== undefined,
      },
    }),
  });

  /**
   * The tool's own check of what a person is about to give (D-101). The identity headers are the
   * gateway's, from the person it just identified, and the marker is one callers cannot set.
   */
  const checkSetup = async (
    tool: string,
    person: Person,
    candidate: { setup: Record<string, string>; secrets: Record<string, string> },
  ): Promise<SetupCheckResult> => {
    const refused = {
      ok: false as const,
      message: "The check could not be completed. Try again.",
      errors: {},
    };
    try {
      const response = await parts.callTool(
        workspace,
        tool,
        new Request(`${origin}/_f/setup-check`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forgeron-setup-check": "1",
            "x-forgeron-user": JSON.stringify(wireUser(person)),
            "x-forgeron-base-url": `${origin}/t/${tool}`,
          },
          body: JSON.stringify(candidate),
        }),
      );
      // No Worker to ask (the tool is not deployed): nothing can be checked, nothing is refused.
      if (!response) return { ok: true };
      return response.ok ? ((await response.json()) as SetupCheckResult) : refused;
    } catch {
      return refused;
    }
  };

  return {
    request,
    workspace,
    /** The person of the request, looked up at most once. */
    who: whoIs,
    platformBindings,

    /**
     * The admin MCP (`/mcp`, D-079). Its caller is a CLI token as a Bearer and nothing else. A tool
     * reaches the platform by calling its routes in this process with that person's identity and
     * `via` set, so the console's guards, validation and audit lines are the ones that apply.
     */
    adminMcp: identity
      ? () => {
          let caller: Promise<Person | undefined> | undefined;
          const person = () => (caller ??= identity.caller.mcpBearer(request, workspace));
          return createAdminMcp({
            version: GATEWAY_VERSION,
            person,
            platform: async (call) => {
              const response = await modules.platform.fetch(
                new Request(`${origin}${call.path}`, {
                  method: call.method,
                  ...(call.body === undefined
                    ? {}
                    : {
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify(call.body),
                      }),
                }),
                { ...platformBindings(call.surface ?? "console", person), via: VIA_FORGERON_MCP },
              );
              const body: unknown = await response.json().catch(() => undefined);
              return { status: response.status, body };
            },
          });
        }
      : undefined,

    /** Per-person secrets are typed at the gateway, never at the tool (D-036). */
    userSecrets: identity
      ? () => ({
          registry,
          workspace,
          // A CLI token may enter secrets: the route is the platform's own.
          identify: (r: Request) => identity.caller.identify(r, workspace, true),
          // The tool's own check of what a person is about to give (D-101). The identity headers are
          // the gateway's, from the person it just identified, and the marker is one callers cannot set.
          checkSetup,
          // The tool's delegated connectors, as steps of its setup page (D-111).
          ...(box
            ? {
                connectors: {
                  consent: async (types: string[]) =>
                    consentFor(
                      workspace,
                      await config.connectorClientsWithSecrets(workspace, types),
                      box,
                      origin,
                    ),
                  consentUrl: (tool: string, environment: string, name: string) =>
                    `${origin}${CONSOLE_API}/api/tools/${tool}/environments/${environment}/consent/${name}`,
                },
              }
            : {}),
        })
      : undefined,

    /** The person's own page of secrets (D-106): the session cookie only, and the tools' checks. */
    mySecrets: identity
      ? () => ({
          workspace,
          registry,
          session: (r: Request) => identity.caller.session(r, workspace),
          checkSetup,
        })
      : undefined,

    /** `forgeron login`'s browser step: the person of the session cookie, then a one-time code. */
    cliLogin: identity
      ? () => ({
          workspace,
          secret: identity.secret,
          registry,
          now,
          session: (r: Request) => identity.caller.session(r, workspace),
        })
      : undefined,

    /** OAuth for MCP clients (D-094): the endpoints a client such as Claude uses to sign in to `/mcp`. */
    mcpOAuth: identity
      ? () => ({
          workspace,
          // The host the client talks to (D-126): an MCP client signs in where it connects, with the
          // session of that host. Its tokens name a tool, not a host, so they work on every host.
          origin: new URL(request.url).origin,
          secret: identity.secret,
          registry,
          now,
          session: (r: Request) => identity.caller.session(r, workspace),
        })
      : undefined,

    /** Sign-in by email code; `undefined` where it is off. */
    emailAuth:
      identity && modules.emailOn && mailer
        ? () =>
            createEmailAuth({
              workspaceOf: modules.hosts.workspaceOf,
              secret: identity.secret,
              registry,
              codes,
              mail: mailer,
              policy: (ws) => modules.policyOf(registry, ws),
              // The "company account" button leads to `/auth/login?method=oidc`: SAML answers it too.
              oidcAvailable: async (ws) =>
                (await modules.samlOf(ws, config, request)) !== undefined ||
                (await modules.providerOf(ws, config, request)) !== undefined,
              now,
              sessionTtlSeconds: options.sessionTtlSeconds ?? 8 * 60 * 60,
              ...(modules.consoleMail
                ? {
                    notice:
                      "Test mode: codes are written to the Worker's logs, so anyone who can read them can sign in as an allowed address.",
                  }
                : {}),
              ...(options.defer ? { defer: options.defer } : {}),
            })
        : undefined,

    /** Sign-in by OIDC and SAML, and the session routes. */
    auth: identity
      ? () =>
          createAuth({
            workspaceOf: modules.hosts.workspaceOf,
            // Single sign-on runs on the primary origin, where its redirect URI is (D-126).
            primaryOrigin: (ws) => modules.hosts.primaryOrigin(ws),
            secret: identity.secret,
            providerFor: (ws) => modules.providerOf(ws, config, request),
            samlFor: (ws) => modules.samlOf(ws, config, request),
            samlRequests: createSamlRequests(env.DB),
            resolvePerson: async (ws, who) => {
              const policy = await modules.policyOf(registry, ws);
              return membership(registry, {
                ...(policy.adminEmail ? { adminEmail: policy.adminEmail } : {}),
                memberDomains: policy.domains,
                ...(policy.defaultTeams ? { defaultTeams: policy.defaultTeams } : {}),
                groupTeams:
                  (await config.getIdentityProvider(ws))?.groupTeams ??
                  (await config.getSamlProvider(ws))?.groupTeams ??
                  {},
              })(ws, who);
            },
            fetch: options.fetch ?? fetch,
            now,
            sessionTtlSeconds: options.sessionTtlSeconds ?? 8 * 60 * 60,
          })
      : undefined,
  };
}
