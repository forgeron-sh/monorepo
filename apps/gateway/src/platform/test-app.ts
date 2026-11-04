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
}) {
  const app = createPlatform();
  return async (request: Request): Promise<Response | undefined> => {
    const response = await app.fetch(request, {
      identity: async () => {
        const who = options.who();
        return who && { id: "p-test", admin: false, developer: false, roles: [], ...who };
      },
      registry: options.registry,
      workspace: options.workspace ?? "acme",
      origin: new URL(request.url).origin,
    });
    return response.headers.has(UNMATCHED) ? undefined : response;
  };
}
