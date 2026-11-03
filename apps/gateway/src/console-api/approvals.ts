import { RegistryError, type Registry } from "@forgeron/registry";

// The versions that wait for an admin, for the console (docs/sdk.md section 3):
//   GET  /api/approvals        -> { versions: [{ tool, id, version, approvals: [{ id, resource, kind }] }] }
//   POST /api/approvals/<id>   body { decision: "approved" | "rejected" }
// Admins only. The registry audits the decision and refuses a second one.

const ROUTE = /^\/api\/approvals(?:\/([A-Za-z0-9_-]+))?$/;

export interface ApprovalsApiOptions {
  registry: Registry;
  workspace: string;
  caller(request: Request): Promise<{ admin: boolean; id: string } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function handleApprovals(
  request: Request,
  options: ApprovalsApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  const id = match[1];
  if (!(id ? request.method === "POST" : request.method === "GET")) {
    return json(405, { error: "METHOD_NOT_ALLOWED" });
  }
  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "This is for admins." });
  const { registry, workspace } = options;
  const tools = await registry.listTools(workspace);

  if (!id) {
    const versions = [];
    for (const tool of tools) {
      for (const { version, approvals } of await registry.pendingVersions(tool.id)) {
        versions.push({
          tool: tool.name,
          id: version.id,
          version: version.version,
          approvals: approvals.map((a) => ({ id: a.id, resource: a.resource, kind: a.kind })),
        });
      }
    }
    return json(200, { versions });
  }

  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return json(415, { error: "INVALID", message: "Send JSON." });
  }
  const body = (await request.json().catch(() => undefined)) as { decision?: unknown } | undefined;
  if (body?.decision !== "approved" && body?.decision !== "rejected") {
    return json(400, { error: "INVALID", message: "`decision` is `approved` or `rejected`." });
  }
  // Only a request of this workspace may be decided here.
  for (const tool of tools) {
    if (!(await registry.listApprovals(tool.id)).some((a) => a.id === id)) continue;
    try {
      const decided = await registry.decideApproval(id, body.decision, caller.id);
      return json(200, { id: decided.id, status: decided.status });
    } catch (error) {
      if (error instanceof RegistryError) {
        return json(error.code === "NOT_FOUND" ? 404 : 409, {
          error: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }
  return json(404, { error: "NOT_FOUND", message: "No such approval." });
}
