import type { Kernel } from "../../kernel/kernel";
import type { UsageReport } from "./types";

// What the platform counts of use (D-093): one number per workspace, tool, person and UTC day, the
// number of authenticated calls that reached the tool. It is the same event that counts a seat
// (D-024), kept per tool and per day. Never a path, a payload or an address.
export function createUsage(kernel: Kernel) {
  const { d1, now, all } = kernel;
  return {
    /** Counts one call. A call a tool makes on its own behalf (`tool:<name>`) is not a person's use. */
    async recordUsage(workspace: string, tool: string, personId: string): Promise<void> {
      if (personId === "" || personId.startsWith("tool:")) return;
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "usage_daily" ("workspace", "tool", "person_id", "day", "calls") VALUES (?, ?, ?, ?, 1)
ON CONFLICT ("workspace", "tool", "person_id", "day") DO UPDATE SET "calls" = "calls" + 1`,
          )
          .bind(workspace, tool, personId, now().slice(0, 10)),
      ]);
    },

    /** Usage between two UTC days, both included (`"2026-11-01"`). */
    async usageReport(workspace: string, from: string, to: string): Promise<UsageReport> {
      const tools = await all(
        `SELECT "tool", SUM("calls") AS "calls", COUNT(DISTINCT "person_id") AS "people"
FROM "usage_daily" WHERE "workspace" = ? AND "day" >= ? AND "day" <= ?
GROUP BY "tool" ORDER BY "calls" DESC, "tool"`,
        workspace,
        from,
        to,
      );
      const people = await all(
        `SELECT u."person_id" AS "person", SUM(u."calls") AS "calls", COALESCE(m."name", '') AS "name", COALESCE(m."email", '') AS "email"
FROM "usage_daily" u LEFT JOIN "members" m ON m."workspace" = u."workspace" AND m."id" = u."person_id"
WHERE u."workspace" = ? AND u."day" >= ? AND u."day" <= ?
GROUP BY u."person_id" ORDER BY "calls" DESC, "person"`,
        workspace,
        from,
        to,
      );
      return {
        from,
        to,
        tools: tools.map((r) => ({
          tool: String(r.tool),
          calls: Number(r.calls),
          people: Number(r.people),
        })),
        people: people.map((r) => ({
          person: String(r.person),
          name: String(r.name),
          email: String(r.email),
          calls: Number(r.calls),
        })),
      };
    },
  };
}
