import type { Hosting } from "@forgeron/hosting";
import type { SignIn } from "@forgeron/platform-contract";
import type { IdentityConfig, Invitation, Registry, ResealReport } from "@forgeron/registry";
import type { ConsolePerson } from "./app";

/** Marks the 404 the tests give for a path that is no route (the gateway gives its own page). */
export const NOT_A_ROUTE = "x-test-not-a-route";
import { createPlatform } from "./platform";

/**
 * The platform app as a test calls it: the person is whatever `who()` says at that moment (fields left
 * out are `false` or empty) and a request for a path Hono does not own answers `undefined`.
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
  officialMarketplace?: string;
}) {
  const app = createPlatform();
  return async (request: Request): Promise<Response | undefined> => {
    const response = await app.fetch(request, {
      identity: async () => {
        const who = options.who();
        return (
          who && {
            id: "p-test",
            email: "p@acme.test",
            name: "P",
            admin: false,
            developer: false,
            roles: [],
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
      marketplaceFetch:
        options.marketplaceFetch ??
        (async () => {
          throw new Error("No GitHub in this test.");
        }),
      ...(options.officialMarketplace ? { officialMarketplace: options.officialMarketplace } : {}),
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
