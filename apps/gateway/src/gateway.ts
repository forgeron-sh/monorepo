import type { D1Database } from "@forgeron/hosting";
import { createRegistry } from "@forgeron/registry";
import { createDispatcher } from "./dispatch/dispatch";
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
  /** The service bindings of self-host, and whatever else the Worker is given. */
  [binding: string]: unknown;
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
    targets: (worker) =>
      env.DISPATCHER ? namespaceTarget(env.DISPATCHER, worker) : serviceBindingTarget(env, worker),
  });
}
