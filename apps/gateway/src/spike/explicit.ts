// SPIKE FOR-144: the same wiring with explicit factories, no container.
import { createRegistry, type Registry } from "@forgeron/registry";
import { createCaller } from "../identity/caller";
import type { RequestDeps } from "./container";

/** Built once per request by one function: the shape of the scope is the return type. */
export function createRequestModules(deps: RequestDeps, now: () => Date) {
  const registry: Registry = createRegistry(deps.d1, { now });
  const caller = createCaller({ registry, secret: deps.secret, now });
  return {
    registry,
    caller,
    whoAmI: async () => (await caller.identify(deps.request, deps.workspace, true))?.person,
  };
}
