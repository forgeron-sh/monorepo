import { auditRoute, usageRoute, workspaceRoute } from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// What the console shell draws (FOR-129) and the workspace's audit log.

const MAX_AUDIT = 200;
const DEFAULT_AUDIT = 50;

export function mountWorkspace(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(workspaceRoute, "member"), async (c) => {
    const { registry, workspace, origin, baseDomain, signIn } = c.env;
    const person = c.get("person");

    const tools = await registry.listTools(workspace);
    let deployed = 0;
    let called = false;
    for (const tool of tools) {
      if ((await registry.listEnvironments(tool.id)).some((e) => e.versionId)) deployed += 1;
      if (!called) {
        called = (await registry.listAudit(tool.id, { kind: "action", limit: 1 })).length > 0;
      }
    }
    return c.json(
      {
        workspace,
        endpoint: origin,
        person: {
          id: person.id,
          email: person.email,
          name: person.name,
          roles: person.roles,
          admin: person.admin,
        },
        setup: {
          members: (await registry.listMembers(workspace)).length,
          invitations: (await registry.listInvitations(workspace)).length,
          tools: tools.length,
          deployed,
          called,
        },
        ...(person.admin ? { signIn: await signIn(), install: { baseDomain } } : {}),
      },
      200,
    );
  });

  // `detail` is not sent: the console shows who did what and when, not payloads. `limit` is lenient.
  app.openapi(platformRoute(auditRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const asked = Number(c.req.valid("query").limit ?? DEFAULT_AUDIT);
    const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MAX_AUDIT) : DEFAULT_AUDIT;
    const people = new Map((await registry.listMembers(workspace)).map((m) => [m.id, m.email]));
    const entries = [];
    for (const tool of await registry.listTools(workspace)) {
      for (const record of await registry.listAudit(tool.id, { limit })) {
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
    return c.json({ entries: entries.slice(0, limit) }, 200);
  });

  // Usage (D-093): counts only, per tool and per person. The period is at most a year of UTC days.
  app.openapi(platformRoute(usageRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const asked = c.req.valid("query");
    const day = 86_400_000;
    const to = asked.to ?? new Date().toISOString().slice(0, 10);
    const from = asked.from ?? new Date(Date.parse(to) - 30 * day).toISOString().slice(0, 10);
    const span = (Date.parse(to) - Date.parse(from)) / day;
    if (!Number.isFinite(span) || span < 0 || span > 365) {
      return c.json(
        {
          error: "INVALID",
          message: "The period must end after it starts and last at most a year.",
        },
        400,
      );
    }
    return c.json(await registry.usageReport(workspace, from, to), 200);
  });

  app.all("/api/workspace", methodNotAllowed);
  app.all("/api/usage", methodNotAllowed);
  app.all("/api/audit", methodNotAllowed);
}
