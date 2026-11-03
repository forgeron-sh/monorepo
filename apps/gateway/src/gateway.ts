import type { D1Database } from "@forgeron/hosting";
import { createRegistry } from "@forgeron/registry";
import { createDispatcher, type Target } from "./dispatch/dispatch";
import { dispatchRegistry, type FromRegistryOptions } from "./dispatch/from-registry";

/** What the gateway Worker is given by its configuration (bindings to fill in `wrangler.jsonc`). */
export interface GatewayEnv {
  /** The platform D1. */
  DB: D1Database;
  /** `forgeron.app`. */
  BASE_DOMAIN: string;
  /**
   * The tool Workers: a dispatch namespace (cloud) or the service bindings of self-host, reached
   * by the Worker's name. The gateway holds the only way to them.
   */
  TOOLS: { get(worker: string): Target | undefined };
}

/**
 * The gateway's request handler. Identity is not built yet, so nobody is in a pilot group and
 * nobody may see a preview (`inPilot` and `canPreview` are absent and fail closed): pilot and
 * previews are not served until it is.
 */
export function createGateway(env: GatewayEnv, options: FromRegistryOptions = {}) {
  return createDispatcher({
    baseDomain: env.BASE_DOMAIN,
    registry: dispatchRegistry(createRegistry(env.DB), options),
    targets: (worker) => env.TOOLS.get(worker),
  });
}
