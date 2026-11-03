import type { Registry } from "@forgeron/registry";
import { RegistryError } from "@forgeron/registry";

// The roles × actions matrix of a tool, for the console (docs/sdk.md section 3, D-039):
//   GET /api/tools/<tool>/access-matrix  -> { roles, actions, cells: { role: { action: { default, override?, allowed } } } }
//   PUT /api/tools/<tool>/access-matrix  body { role, action, allowed: true | false | null }
// `null` gives the cell back to the manifest's levels. Only an admin may call them, and a change
// is written to the audit log by the registry. It takes effect on the next call, on every interface.

const ROUTE = /^\/api\/tools\/([a-z0-9-]+)\/access-matrix$/;

export interface AccessMatrixApiOptions {
  registry: Registry;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The caller, resolved by identity: `undefined` is anonymous. */
  caller(request: Request): Promise<{ admin: boolean; id?: string } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Answers an access-matrix route, or `undefined` when the request is for another route. */
export async function handleAccessMatrix(
  request: Request,
  options: AccessMatrixApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  if (request.method !== "GET" && request.method !== "PUT") {
    return json(405, { error: "METHOD_NOT_ALLOWED" });
  }

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin || !caller.id) {
    return json(403, { error: "FORBIDDEN", message: "The access matrix is for admins." });
  }

  const tool = await options.registry.findTool(options.workspace, match[1]!);
  if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${match[1]}.` });

  try {
    if (request.method === "GET") return json(200, await options.registry.accessMatrix(tool.id));

    let body: { role?: unknown; action?: unknown; allowed?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json(400, { error: "INVALID", message: "The body is not JSON." });
    }
    if (
      typeof body.role !== "string" ||
      typeof body.action !== "string" ||
      (typeof body.allowed !== "boolean" && body.allowed !== null)
    ) {
      return json(400, {
        error: "INVALID",
        message: "`role` and `action` are strings, `allowed` is true, false or null.",
      });
    }
    await options.registry.setRoleAccess(
      tool.id,
      body.role,
      body.action,
      body.allowed ?? undefined,
      caller.id,
    );
    return json(200, await options.registry.accessMatrix(tool.id));
  } catch (error) {
    if (error instanceof RegistryError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "NO_MANIFEST" ? 409 : 500;
      return json(status, { error: error.code, message: error.message });
    }
    throw error;
  }
}
