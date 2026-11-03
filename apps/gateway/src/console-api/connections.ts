import type { AuditEntry, Registry } from "@forgeron/registry";

// The connections routes of the platform API (docs/sdk.md section 10, delegated connectors):
//   GET    /api/tools/<tool>/environments/<env>/connections                      -> who consented
//   DELETE /api/tools/<tool>/environments/<env>/connections/<user>/<connector>   -> revokes one
// Only an admin may call them. The answers say who consented to what, never a token.

const ROUTE =
  /^\/api\/tools\/([a-z0-9-]+)\/environments\/(preview|pilot|production)\/connections(?:\/([^/]+)\/([a-z][a-z0-9-]*))?$/;

export interface ConnectionsApiOptions {
  registry: Registry;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The caller, resolved by identity: `undefined` is anonymous. */
  caller(request: Request): Promise<{ admin: boolean; id?: string } | undefined>;
  /** Records an admin's revocation (D-046). Defaults to the registry's audit log. */
  audit?(entry: AuditEntry): Promise<void>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Answers a connections route, or `undefined` when the request is for another route. */
export async function handleConnections(
  request: Request,
  options: ConnectionsApiOptions,
): Promise<Response | undefined> {
  const match = ROUTE.exec(new URL(request.url).pathname);
  if (!match) return undefined;
  const [, toolName, environment, user, connector] = match as unknown as [
    string,
    string,
    "preview" | "pilot" | "production",
    string | undefined,
    string | undefined,
  ];

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin)
    return json(403, { error: "FORBIDDEN", message: "Connections are for admins." });

  const tool = await options.registry.findTool(options.workspace, toolName);
  if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${toolName}.` });

  if (request.method === "GET" && user === undefined) {
    return json(200, { connections: await options.registry.listConnections(tool.id, environment) });
  }
  if (request.method === "DELETE" && user !== undefined && connector !== undefined) {
    let userId: string;
    try {
      userId = decodeURIComponent(user);
    } catch {
      return json(400, { error: "INVALID", message: "The person is not valid." });
    }
    const revoked = await options.registry.revokeConnection({
      toolId: tool.id,
      environment,
      userId,
      connector,
    });
    if (revoked) {
      await (options.audit ?? ((e) => options.registry.recordAudit(e)))({
        toolId: tool.id,
        actor: caller.id ?? "admin",
        interface: "api",
        kind: "access",
        subject: `connector-consent:${connector}:revoke`,
        detail: { environment, person: userId },
      }).catch(() => undefined);
    }
    return revoked
      ? new Response(null, { status: 204 })
      : json(404, { error: "NOT_FOUND", message: "That person has no such consent." });
  }
  return json(405, { error: "METHOD_NOT_ALLOWED" });
}
