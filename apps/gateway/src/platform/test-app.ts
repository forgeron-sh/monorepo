import type { SignIn } from "@forgeron/platform-contract";
import type { Registry } from "@forgeron/registry";
import { UNMATCHED, type ConsolePerson } from "./app";
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
      signIn:
        options.signIn ??
        (async () => ({
          email: { enabled: false, mail: "off" as const },
          oidc: { enabled: false, configured: false },
          saml: { enabled: false, configured: false },
        })),
    });
    return response.headers.has(UNMATCHED) ? undefined : response;
  };
}
