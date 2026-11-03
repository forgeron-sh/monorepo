import type { Registry } from "@forgeron/registry";
import { RegistryError } from "@forgeron/registry";

// The roles × actions matrix of a tool, for the console (docs/sdk.md section 3, D-039):
//   GET /api/tools/<tool>/access-matrix  -> { roles, actions, cells: { role: { action: { default, override?, allowed } } } }
//   PUT /api/tools/<tool>/access-matrix  body { changes: [{ role, action, allowed: true | false | null }] }
// `action` is an action name or `view:<name>`; `null` gives the cell back to the manifest's levels.
// The changes are applied together, in one batch with their audit lines: all or none (D-044). Only an admin may call them, and a change
// is written to the audit log by the registry. It takes effect on the next call, on every interface.

const MAX_CHANGES = 500;
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

    let body: { changes?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json(400, { error: "INVALID", message: "The body is not JSON." });
    }
    const changes = Array.isArray(body.changes) ? body.changes : undefined;
    const valid =
      changes !== undefined &&
      changes.length > 0 &&
      changes.length <= MAX_CHANGES &&
      changes.every(
        (c: { role?: unknown; action?: unknown; allowed?: unknown }) =>
          typeof c?.role === "string" &&
          typeof c.action === "string" &&
          (typeof c.allowed === "boolean" || c.allowed === null),
      );
    if (!valid) {
      return json(400, {
        error: "INVALID",
        message: `\`changes\` is 1 to ${MAX_CHANGES} of { role, action, allowed: true, false or null }.`,
      });
    }
    await options.registry.setRoleAccessMany(
      tool.id,
      (changes as Array<{ role: string; action: string; allowed: boolean | null }>).map((c) => ({
        role: c.role,
        action: c.action,
        allowed: c.allowed ?? undefined,
      })),
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
