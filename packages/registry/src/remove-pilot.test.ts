import { applyMigrations, type D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { migratePlatform, platformMigrations } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The platform of an install that predates the removal of the pilot environment (D-055): the schema
// up to 0018, with data in every table the removal touches.
let memory: MemoryD1;
let d1: D1Database;

const run = (sql: string, ...values: unknown[]) => d1.batch([d1.prepare(sql).bind(...values)]);
const rows = async (sql: string) => (await d1.prepare(sql).all()).results as Array<unknown>;

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  const before = platformMigrations.findIndex((m) => m.name === "0019_remove_pilot");
  await applyMigrations(d1, platformMigrations.slice(0, before));
  const at = "2026-11-03T12:00:00.000Z";
  await run(`INSERT INTO "tools" VALUES ('t1', 'acme', 'crm', ?)`, at);
  await run(
    `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "created_at") VALUES ('b1', 't1', 'fp', '{}', ?)`,
    at,
  );
  await run(`INSERT INTO "versions" VALUES ('v1', 't1', 'b1', '1.0.0', ?)`, at);
  for (const [id, name, branch] of [
    ["e-prod", "production", ""],
    ["e-pilot", "pilot", ""],
    ["e-prev", "preview", "feat"],
  ]) {
    await run(
      `INSERT INTO "environments" ("id", "tool_id", "name", "branch", "version_id", "created_at", "pilot_group") VALUES (?, 't1', ?, ?, 'v1', ?, ?)`,
      id,
      name,
      branch,
      at,
      name === "pilot" ? "early" : null,
    );
    await run(
      `INSERT INTO "deployments" VALUES (?, 't1', ?, 'v1', 'deploy', 'ely', ?)`,
      `d-${id}`,
      id,
      at,
    );
  }
  for (const environment of ["production", "pilot", "preview"]) {
    await run(`INSERT INTO "secrets" VALUES ('t1', ?, 'KEY', 'iv', 'ct', ?)`, environment, at);
  }
  for (const environment of ["production", "pilot"]) {
    await run(
      `INSERT INTO "connections" VALUES ('t1', ?, 'u1', 'hubspot', 'crm', NULL, 'iv', 'ct', ?, ?)`,
      environment,
      at,
      at,
    );
  }
  await run(
    `INSERT INTO "members" ("workspace", "id", "subject", "email", "name", "roles", "created_at") VALUES ('acme', 'm1', 's1', 'ada@acme.test', 'Ada', '[]', ?)`,
    at,
  ).catch(() => undefined);
});
afterEach(() => memory.close());

describe("0019_remove_pilot", () => {
  it("removes the pilot of an installed platform and keeps everything else", async () => {
    expect(await migratePlatform(d1)).toEqual({
      applied: ["0019_remove_pilot", "0020_tool_docs"],
    });

    expect(await rows(`SELECT "id", "name" FROM "environments" ORDER BY "id"`)).toEqual([
      { id: "e-prev", name: "preview" },
      { id: "e-prod", name: "production" },
    ]);
    // What each remaining environment served, and who put it there, survives the rebuild.
    expect(await rows(`SELECT "id", "environment_id" FROM "deployments" ORDER BY "id"`)).toEqual([
      { id: "d-e-prev", environment_id: "e-prev" },
      { id: "d-e-prod", environment_id: "e-prod" },
    ]);
    expect(await rows(`SELECT "environment" FROM "secrets" ORDER BY 1`)).toEqual([
      { environment: "preview" },
      { environment: "production" },
    ]);
    expect(await rows(`SELECT "environment" FROM "connections"`)).toEqual([
      { environment: "production" },
    ]);
    expect(await rows(`SELECT 1 FROM "versions"`)).toHaveLength(1);
  });

  it("leaves no pilot column, table or allowed name behind", async () => {
    await migratePlatform(d1);
    const columns = (await rows(`PRAGMA table_info("environments")`)) as Array<{ name: string }>;
    expect(columns.map((c) => c.name)).not.toContain("pilot_group");
    expect(await rows(`SELECT name FROM sqlite_master WHERE name = 'group_members'`)).toEqual([]);
    await expect(
      run(
        `INSERT INTO "environments" ("id", "tool_id", "name", "created_at") VALUES ('x', 't1', 'pilot', 'now')`,
      ),
    ).rejects.toThrow(/CHECK/);
    await expect(
      run(`INSERT INTO "secrets" VALUES ('t1', 'pilot', 'K', 'iv', 'ct', 'now')`),
    ).rejects.toThrow(/CHECK/);
  });

  it("still deletes a tool with everything under it", async () => {
    await migratePlatform(d1);
    await run(`DELETE FROM "tools" WHERE "id" = 't1'`);
    for (const table of ["environments", "deployments", "secrets", "connections"]) {
      expect(await rows(`SELECT 1 FROM "${table}"`)).toEqual([]);
    }
  });
});
