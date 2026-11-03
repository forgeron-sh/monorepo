import type { Registry } from "@forgeron/registry";

// `GET /api/audit[?limit=n]`: the latest audit lines of the workspace's tools, newest first, for admins
//   { entries: [{ id, at, tool, actor (the email of a member), interface, kind, subject, result }] }
// Each tool contributes its latest `limit` lines; the merged list is cut to `limit` (default 50, at most 200).
// `detail` is not sent: the console shows who did what and when, not payloads.

const MAX = 200;

export interface AuditApiOptions {
  registry: Registry;
  workspace: string;
  caller(request: Request): Promise<{ admin: boolean } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function handleAudit(
  request: Request,
  options: AuditApiOptions,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/audit") return undefined;
  if (request.method !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });
  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "This is for admins." });
  const asked = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MAX) : 50;

  const people = new Map(
    (await options.registry.listMembers(options.workspace)).map((m) => [m.id, m.email]),
  );
  const entries = [];
  for (const tool of await options.registry.listTools(options.workspace)) {
    for (const record of await options.registry.listAudit(tool.id, { limit })) {
      entries.push({
        id: record.id,
        at: record.at,
        tool: tool.name,
        actor: people.get(record.actor) ?? record.actor,
        interface: record.interface,
        kind: record.kind,
        subject: record.subject,
        result: record.result,
      });
    }
  }
  entries.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? 1 : -1));
  return json(200, { entries: entries.slice(0, limit) });
}
