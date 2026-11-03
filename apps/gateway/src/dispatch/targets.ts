import type { Target } from "./dispatch";

// How the gateway holds the Workers of the tools (docs/ARCHITECTURE.md, "Hosting modes"). The
// dispatcher only asks for a Worker by name; where it comes from depends on the hosting mode:
//
// - Forgeron Cloud: a dispatch namespace binding. `get(name)` gives a Fetcher without checking that
//   the script exists; the `fetch` of a missing one throws an error whose message starts with
//   "Worker not found" (Cloudflare documentation, Workers for Platforms, dynamic dispatch).
// - Self-host: one service binding per Worker, added by redeploying the gateway when a tool is
//   created or deleted. The name of the binding is derived from the name of the Worker.

/** A dispatch namespace binding, as the Workers runtime gives it. */
export interface DispatchNamespace {
  get(worker: string): Target;
}

const NOT_FOUND = "Worker not found";

const unreachable = () =>
  Response.json(
    { error: { code: "UPSTREAM", message: "The tool is not reachable." } },
    { status: 502 },
  );

/** Cloud: a Worker of the namespace. A script that is gone answers 502, like a missing binding. */
export function namespaceTarget(namespace: DispatchNamespace, worker: string): Target {
  return {
    async fetch(request) {
      try {
        return await namespace.get(worker).fetch(request);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith(NOT_FOUND)) return unreachable();
        throw error;
      }
    },
  };
}

/**
 * The name of the service binding of a Worker: `acme--crm--production` is `TOOL_ACME__CRM__PRODUCTION`.
 * Worker names are `[a-z0-9-]`, so the mapping is one to one, and no other binding of the gateway
 * (`DB`, `BASE_DOMAIN`…) can ever be taken for a tool.
 */
export const serviceBindingOf = (worker: string): string =>
  `TOOL_${worker.toUpperCase().replaceAll("-", "_")}`;

const isTarget = (value: unknown): value is Target =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { fetch?: unknown }).fetch === "function";

/** Self-host: the service binding of a Worker, if the gateway has one. */
export function serviceBindingTarget(
  bindings: Record<string, unknown>,
  worker: string,
): Target | undefined {
  const binding = bindings[serviceBindingOf(worker)];
  return isTarget(binding) ? binding : undefined;
}
