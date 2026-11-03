import type { D1Database } from "@forgeron/hosting";
import { createRegistry } from "@forgeron/registry";
import { handleSecrets } from "./console-api/secrets";
import { handleSecretsStatus } from "./console-api/secrets-status";
import { handleTools } from "./console-api/tools";
import { createDispatcher, workspaceOf, type DispatcherOptions } from "./dispatch/dispatch";
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
  /**
   * The built console (`apps/console/dist`, `assets` in `wrangler.jsonc`). It is the only app code
   * served at the workspace origin (sdk.md §7, "Isolation between tools on the same origin").
   */
  ASSETS?: { fetch(request: Request): Response | Promise<Response> };
  /** The service bindings of self-host, and whatever else the Worker is given. */
  [binding: string]: unknown;
}

/** Where the console reads and writes on the workspace origin. */
const CONSOLE_API = "/console-api";

const CONSOLE_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

const notFound = () =>
  Response.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });

/**
 * The gateway's request handler. On a workspace origin: `/t/<tool>…` is dispatched to the tool,
 * `/console-api/…` is the console's API, and every other path is the console itself. Identity is
 * not built yet, so nobody is in a pilot group, nobody may see a preview, and the console's API
 * has no caller (`401`): all of it fails closed until it is.
 */
export function createGateway(
  env: GatewayEnv,
  options: FromRegistryOptions & { identify?: DispatcherOptions["identify"] } = {},
) {
  const registry = createRegistry(env.DB);
  const dispatch = createDispatcher({
    baseDomain: env.BASE_DOMAIN,
    registry: dispatchRegistry(registry, options),
    // Seats are counted once identity tells who called (`identify`); without it nothing is counted.
    ...(options.identify
      ? {
          identify: options.identify,
          recordSeat: (workspace: string, personId: string) =>
            registry.recordSeat(workspace, personId),
        }
      : {}),
    targets: (worker) =>
      env.DISPATCHER ? namespaceTarget(env.DISPATCHER, worker) : serviceBindingTarget(env, worker),
  });

  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const workspace = workspaceOf(url.host, env.BASE_DOMAIN);
    if (!workspace || url.pathname === "/t" || url.pathname.startsWith("/t/")) {
      return dispatch(request);
    }

    if (url.pathname.startsWith(`${CONSOLE_API}/`)) {
      const inner = new URL(url);
      inner.pathname = url.pathname.slice(CONSOLE_API.length);
      const forwarded = new Request(inner, request);
      const caller = async () => undefined;
      return (
        (await handleSecretsStatus(forwarded, { registry, workspace, caller })) ??
        (await handleTools(forwarded, { registry, workspace, caller })) ??
        (await handleSecrets(forwarded, { registry, workspace, caller })) ??
        notFound()
      );
    }

    // The workspace's own API paths belong to parts of the gateway that do not exist yet: never the console.
    if (/^\/(mcp|api|cli)(\/|$)/.test(url.pathname)) return notFound();

    if (request.method !== "GET" && request.method !== "HEAD") {
      return Response.json(
        { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } },
        { status: 405, headers: { allow: "GET, HEAD" } },
      );
    }
    if (!env.ASSETS) return notFound();
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set("content-security-policy", CONSOLE_CSP);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "same-origin");
    return new Response(asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  };
}
