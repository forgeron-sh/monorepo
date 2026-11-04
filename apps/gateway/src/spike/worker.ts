// SPIKE FOR-144: the real gateway plus the Awilix container, to measure what the container adds.
import gateway from "../index";
import type { GatewayEnv } from "../gateway";
import { createRequestScope, createRoot, type Root } from "./container";

let root: Root | undefined;

export default {
  fetch: async (
    request: Request,
    env: GatewayEnv,
    ctx: { waitUntil(w: Promise<unknown>): void },
  ) => {
    const url = new URL(request.url);
    if (url.pathname !== "/spike/whoami") return gateway.fetch(request, env, ctx);
    root ??= createRoot();
    const scope = createRequestScope(root, {
      d1: env.DB,
      workspace: url.host.split(".")[0]!,
      request,
      secret: env.AUTH_SECRET ?? "",
    });
    const person = await scope.cradle.whoAmI.execute();
    return Response.json({ person: person ?? null });
  },
};
