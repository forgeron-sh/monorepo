// Dispatch (sdk.md §7, "Addresses" and "Routing on Cloudflare"): `<workspace>.<base domain>` is the
// workspace, `/t/<tool>[@<branch>]/<rest>` is a tool in an environment. A request reaches the Worker
// of that tool through a binding the gateway holds, or it is refused. Tool Workers have no public
// route: the only way to them is `targets`, so nothing here fetches a URL for a tool.
// Identity is not here: whether the caller may see a preview is asked of the hook
// `canPreview`, which fails closed when absent.

import { workspaceOf } from "../kernel/workspace";

// Re-exported for the gateway and the tests: the function lives in the kernel (no cycle with identity).
export { workspaceOf };

/** What the registry knows of a tool: the Worker of each environment (`<workspace>--<tool>--…`). */
export interface ToolEntry {
  production?: string;
  /** By branch. */
  previews: Record<string, string>;
}

export interface Registry {
  /** `undefined` when the workspace or the tool does not exist. */
  find(workspace: string, tool: string): ToolEntry | undefined | Promise<ToolEntry | undefined>;
}

/** A tool's Worker as the gateway holds it: a dispatch-namespace or service binding. */
export interface Target {
  fetch(request: Request): Response | Promise<Response>;
}

export interface Caller {
  workspace: string;
  tool: string;
  request: Request;
  /** The environment the call is served from, once it is known (set when the request is forwarded). */
  environment?: "preview" | "production";
  /** The preview's branch, for a call served from one (D-109). */
  branch?: string;
}

/** What the gateway adds to the request it hands a tool, or the answer that stops it (D-035). */
export type Forwarding = { headers: Record<string, string> } | { refuse: Response };

/** The headers only the gateway may set: whatever the caller sent under these names is dropped. */
const INTERNAL_HEADERS = [
  "x-forgeron-user",
  "x-forgeron-user-secrets",
  "x-forgeron-user-setup",
  "x-forgeron-setup-check",
  "x-forgeron-base-url",
  "x-forgeron-connector-tokens",
  "x-forgeron-connector-consent",
];

/**
 * What a tool's response may not do on the workspace origin (sdk.md §7, Isolation points 1 and 4):
 * it runs sandboxed (an opaque origin: no cookies, no session to call an API with), it is not
 * sniffed into another type, and it cannot set a cookie, which would plant or replace one for the
 * whole origin, the session's included.
 */
const TOOL_SANDBOX = "sandbox allow-scripts allow-forms allow-popups allow-downloads";

function confined(response: Response, challenge?: string): Response {
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  // A tool says nothing about where a client signs in: the gateway does, or nobody does (D-095).
  headers.delete("www-authenticate");
  if (challenge && response.status === 401) headers.set("www-authenticate", challenge);
  headers.set("content-security-policy", TOOL_SANDBOX);
  headers.set("x-content-type-options", "nosniff");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export interface DispatcherOptions {
  /** `forgeron.app`: the workspace is the one label in front of it. */
  baseDomain: string;
  registry: Registry;
  /** The Worker of that name, or `undefined` if the gateway has no binding to it. */
  targets(worker: string): Target | undefined;
  /**
   * The person behind an authenticated call (a valid token or session), or `undefined` for an
   * anonymous one. With `recordSeat`, it is what counts the workspace's seats (D-024).
   */
  identify?(caller: Caller): string | undefined | Promise<string | undefined>;
  /** Counts a person's seat in a workspace. A failure never blocks the call. */
  recordSeat?(workspace: string, personId: string): void | Promise<void>;
  /** Counts one authenticated call to a tool, for the usage report (D-093). A failure never blocks the call. */
  recordUsage?(workspace: string, tool: string, personId: string): void | Promise<void>;
  /**
   * Who is calling, for the tool's runtime: the headers that carry the person and their own
   * per-person secrets, or a refusal (a token issued for another tool is `403`). Called once the
   * tool is found and before the request reaches it. Without it a tool sees nobody.
   */
  forward?(caller: Caller): Forwarding | undefined | Promise<Forwarding | undefined>;
  /** May this caller see a branch preview? Without it, nobody does. */
  canPreview?(caller: Caller & { branch: string }): boolean | Promise<boolean>;
}

/**
 * The gateway's own call to a tool's Worker, for what is not a caller's request (D-101: the check of a
 * setup). It finds the production Worker of the tool exactly as the dispatcher does and refuses one
 * that is not the workspace's; the caller of this function supplies the identity headers, since no
 * person's request is behind it. `undefined` when the tool has no Worker the gateway can reach.
 */
export function createToolCaller(options: Pick<DispatcherOptions, "registry" | "targets">) {
  return async (
    workspace: string,
    tool: string,
    request: Request,
  ): Promise<Response | undefined> => {
    const entry = await options.registry.find(workspace, tool);
    const worker = entry?.production;
    if (!worker?.startsWith(`${workspace}--${tool}--`)) return undefined;
    return options.targets(worker)?.fetch(request);
  };
}

// sdk.md §7: workspace names are `[a-z0-9-]`, 3 to 40 characters (see `kernel/workspace.ts`).
const TOOL = /^[a-z0-9][a-z0-9-]*$/;
const BRANCH = /^[a-z0-9][a-z0-9._-]*$/;

export interface ToolPath {
  tool: string;
  branch?: string;
  /** The path the tool sees: `/mcp`, `/api/deals.move`, `/` for the tool's root. */
  rest: string;
}

/** `/t/<tool>[@<branch>]/<rest>`; anything else is not a tool path. */
export function parseToolPath(pathname: string): ToolPath | undefined {
  const match = /^\/t\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match) return undefined;
  const [name, branch, ...extra] = match[1]!.split("@");
  if (extra.length > 0 || name === undefined || !TOOL.test(name)) return undefined;
  if (branch !== undefined && !BRANCH.test(branch)) return undefined;
  return { tool: name, ...(branch !== undefined ? { branch } : {}), rest: match[2] ?? "/" };
}

const refuse = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export function createDispatcher(options: DispatcherOptions) {
  return async function dispatch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const workspace = workspaceOf(url.host, options.baseDomain);
    if (!workspace) return refuse(404, "NOT_FOUND", "Not found.");
    const path = parseToolPath(url.pathname);
    // The workspace's own paths (`/`, `/mcp`, `/settings`…) belong to other parts of the gateway.
    if (!path) return refuse(404, "NOT_FOUND", "Not found.");

    const entry = await options.registry.find(workspace, path.tool);
    if (!entry) return refuse(404, "NOT_FOUND", "Not found.");

    const caller: Caller = { workspace, tool: path.tool, request };
    let worker: string | undefined;
    let environment: "preview" | "production" = "production";
    if (path.branch !== undefined) {
      environment = "preview";
      worker = entry.previews[path.branch];
      if (!worker) return refuse(404, "NOT_FOUND", "Not found.");
      if (!(await options.canPreview?.({ ...caller, branch: path.branch }))) {
        return refuse(403, "FORBIDDEN", "You cannot see this preview.");
      }
    } else {
      worker = entry.production;
      if (!worker) return refuse(404, "NOT_FOUND", "Not found.");
    }

    // A registry that points a workspace at another's Worker would cross the isolation: fail closed.
    if (!worker.startsWith(`${workspace}--${path.tool}--`)) {
      return refuse(500, "INTERNAL", "The tool is not deployed correctly.");
    }
    const target = options.targets(worker);
    if (!target) return refuse(502, "UPSTREAM", "The tool is not reachable.");

    // An authenticated call that reaches a tool is a seat of the workspace for the month.
    if (options.identify && options.recordSeat) {
      try {
        const person = await options.identify(caller);
        if (person) {
          await options.recordSeat(workspace, person);
          await options.recordUsage?.(workspace, path.tool, person);
        }
      } catch {
        // Counting must never stop a person from working.
      }
    }

    const forwarding = await options.forward?.({
      ...caller,
      environment,
      ...(path.branch !== undefined ? { branch: path.branch } : {}),
    });
    if (forwarding && "refuse" in forwarding) return forwarding.refuse;

    const forwarded = new URL(url);
    forwarded.pathname = path.rest;
    const outgoing = new Request(forwarded, request);
    // Identity comes from the gateway or from nowhere: a caller cannot choose who it is.
    for (const name of INTERNAL_HEADERS) outgoing.headers.delete(name);
    // The session cookie is for the console and the identity gateway only: a tool never sees it.
    outgoing.headers.delete("cookie");
    for (const [name, value] of Object.entries(forwarding?.headers ?? {})) {
      outgoing.headers.set(name, value);
    }
    // A `401` on a tool's MCP tells the client where to sign in (RFC 9728, D-095).
    const challenge = /^\/mcp\/?$/.test(path.rest)
      ? `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource${url.pathname.replace(/\/mcp\/?$/, "")}/mcp"`
      : undefined;
    return confined(await target.fetch(outgoing), challenge);
  };
}
