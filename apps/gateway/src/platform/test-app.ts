import type { Hosting } from "@forgeron/hosting";
import type { SignIn } from "@forgeron/platform-contract";
import type { IdentityConfig, Invitation, Registry, ResealReport } from "@forgeron/registry";
import type { ConsolePerson } from "./app";

/** Marks the 404 the tests give for a path that is no route (the gateway gives its own page). */
export const NOT_A_ROUTE = "x-test-not-a-route";
import { createPlatform } from "./platform";
import { createPlatformUpdates, type PlatformUpdate } from "../platform-update/update";

/**
 * The platform app as a test calls it: the person is whatever `who()` says at that moment (fields left
 * out are empty: a person who holds nothing) and a request for a path Hono does not own answers `undefined`.
 */
export function platformCaller(options: {
  registry: Registry;
  workspace?: string;
  who(): Partial<ConsolePerson> | undefined;
  signIn?: () => Promise<SignIn>;
  baseDomain?: string;
  hosting?: () => Hosting | undefined;
  installDomains?: string[];
  config?: IdentityConfig;
  canKeepSecrets?: boolean;
  reseal?: () => Promise<ResealReport>;
  notifySecretSet?: (person: string, tool: string, field: string) => Promise<boolean>;
  now?: () => Date;
  notify?: (invitation: Invitation) => Promise<boolean>;
  databaseTimeoutMs?: number;
  marketplaceFetch?: typeof fetch;
  /** A simulated GitHub, for the workspace's GitHub App and GitHub Actions' keys (D-123). */
  githubFetch?: typeof fetch;
  officialMarketplace?: string;
  /** The token secret, for a route that issues a token (D-121). */
  tokenSecret?: string;
  /** The platform updating itself (D-138); by default one that is off. */
  update?: PlatformUpdate;
  /** `root` for the routes outside `/console-api` (`/github/…`, D-123). */
  surface?: "console" | "root";
}) {
  const app = createPlatform();
  return async (request: Request): Promise<Response | undefined> => {
    const response = await app.fetch(request, {
      ...(options.surface ? { surface: options.surface } : {}),
      identity: async () => {
        const who = options.who();
        return (
          who && {
            id: "p-test",
            email: "p@acme.test",
            name: "P",
            teams: [],
            permissions: [],
            ...who,
          }
        );
      },
      registry: options.registry,
      workspace: options.workspace ?? "acme",
      origin: new URL(request.url).origin,
      baseDomain: options.baseDomain ?? "forgeron.test",
      installDomains: options.installDomains ?? [],
      config: options.config ?? ({} as IdentityConfig),
      canKeepSecrets: options.canKeepSecrets ?? false,
      ...(options.reseal ? { reseal: options.reseal } : {}),
      ...(options.notifySecretSet ? { notifySecretSet: options.notifySecretSet } : {}),
      now: options.now ?? (() => new Date()),
      ...(options.notify ? { notify: options.notify } : {}),
      hosting: options.hosting ?? (() => undefined),
      update:
        options.update ??
        createPlatformUpdates({
          env: { DB: undefined as never, SELF_UPDATE: "off" },
          fetch: () => fetch,
          now: () => new Date(),
          current: { version: "0.0.0" },
        }).of(options.registry),
      marketplaceFetch:
        options.marketplaceFetch ??
        (async () => {
          throw new Error("No GitHub in this test.");
        }),
      githubFetch:
        options.githubFetch ??
        (async () => {
          throw new Error("No GitHub in this test.");
        }),
      ...(options.officialMarketplace ? { officialMarketplace: options.officialMarketplace } : {}),
      ...(options.tokenSecret
        ? {
            bearer: {
              secret: options.tokenSecret,
              person: async () => undefined,
              session: async () => undefined,
            },
          }
        : {}),
      ...(options.databaseTimeoutMs ? { databaseTimeoutMs: options.databaseTimeoutMs } : {}),
      notFound: () => new Response(null, { status: 404, headers: { [NOT_A_ROUTE]: "1" } }),
      signIn:
        options.signIn ??
        (async () => ({
          email: { enabled: false, mail: "off" as const },
          oidc: { enabled: false, configured: false },
          saml: { enabled: false, configured: false },
        })),
    });
    return response.headers.has(NOT_A_ROUTE) ? undefined : response;
  };
}
