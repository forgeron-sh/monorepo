import { applyMigrations, type D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, platformMigrations } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// An install from before channels (D-125): production and branch previews, their history, and the
// pilot rules of D-119. The migration keeps every row and gives them their new meaning.
let memory: MemoryD1;
let d1: D1Database;

const run = (sql: string, ...values: unknown[]) => d1.batch([d1.prepare(sql).bind(...values)]);
const rows = async (sql: string) => (await d1.prepare(sql).all()).results as Array<unknown>;

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  const before = platformMigrations.findIndex((m) => m.name === "0036_channels");
  await applyMigrations(d1, platformMigrations.slice(0, before));
  const at = "2026-11-10T12:00:00.000Z";
  await run(`INSERT INTO "tools" VALUES ('t1', 'acme', 'crm', ?)`, at);
  await run(
    `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "created_at") VALUES ('b1', 't1', 'fp1', '{}', '{"entries":[{}],"declared":"patch","detected":"none"}', ?), ('b2', 't1', 'fp2', '{}', NULL, ?)`,
    at,
    at,
  );
  await run(
    `INSERT INTO "versions" VALUES ('v1', 't1', 'b1', '1.0.0-preview.main+fp1', ?), ('v2', 't1', 'b2', '1.0.0-preview.feat+fp2', ?)`,
    at,
    at,
  );
  await run(
    `INSERT INTO "environments" ("id", "tool_id", "name", "branch", "version_id", "url", "activated_at", "created_at") VALUES ('e-prod', 't1', 'production', '', 'v1', 'https://x/t/crm', ?, ?), ('e-main', 't1', 'preview', 'main', 'v1', NULL, ?, ?), ('e-feat', 't1', 'preview', 'feat', 'v2', NULL, ?, ?)`,
    at,
    at,
    at,
    at,
    at,
    at,
  );
  await run(
    `INSERT INTO "deployments" ("id", "tool_id", "environment_id", "version_id", "kind", "actor", "created_at", "commit_sha", "commit_message", "commit_author") VALUES ('d1', 't1', 'e-main', 'v1', 'deploy', 'ci', ?, 'abc1234', 'Init', 'Ada'), ('d2', 't1', 'e-prod', 'v1', 'promote', 'root', ?, NULL, NULL, NULL), ('d3', 't1', 'e-feat', 'v2', 'deploy', 'ci', ?, 'def5678', 'Feat', 'Ben')`,
    at,
    at,
    at,
  );
  await run(
    `INSERT INTO "preview_availability" VALUES ('t1', 'feat', 'people', '["m1"]', 'root', ?)`,
    at,
  );
  await run(`INSERT INTO "person_previews" VALUES ('t1', 'feat', 'm1', ?)`, at);
  await migratePlatform(d1);
});
afterEach(() => memory.close());

describe("0036_channels and 0037_channel_access", () => {
  it("keep production and the previews, now temporary channels, with their history", async () => {
    const registry = createRegistry(d1);
    const environments = await registry.listEnvironments("t1");
    expect(environments.map((e) => [e.id, e.name, e.branch, e.channel, e.versionId])).toEqual([
      ["e-feat", "preview", "feat", undefined, "v2"],
      ["e-main", "preview", "main", undefined, "v1"],
      ["e-prod", "production", undefined, undefined, "v1"],
    ]);
    expect((await registry.history("e-main")).map((d) => [d.id, d.commit?.sha])).toEqual([
      ["d1", "abc1234"],
    ]);
    expect((await registry.history("e-prod")).map((d) => d.kind)).toEqual(["promote"]);
  });

  it("give each version the branch whose preview first served it", async () => {
    const registry = createRegistry(d1);
    expect((await registry.getVersion("v1"))?.branch).toBe("main");
    expect((await registry.getVersion("v2"))?.branch).toBe("feat");
    // Production follows main: v1 is a release of it and is already served.
    expect(await registry.availableUpdate("t1")).toBeUndefined();
  });

  it("turn the pilot rules into channel access, and the pilots into library entries", async () => {
    const registry = createRegistry(d1);
    expect(await registry.channelAccessOf("t1", "feat")).toMatchObject({
      mode: "people",
      people: ["m1"],
    });
    expect(await registry.channelsOf("m1")).toEqual([{ toolId: "t1", channel: "feat" }]);
    expect(
      await rows(`SELECT name FROM sqlite_master WHERE name = 'preview_availability'`),
    ).toEqual([]);
  });

  it("let an admin add a permanent channel next to production", async () => {
    const registry = createRegistry(d1);
    await registry.addChannel({ toolId: "t1", name: "staging", follows: "main", actor: "root" });
    expect(await registry.availableUpdate("t1", "staging")).toEqual({
      version: "1.0.0-preview.main+fp1",
      branch: "main",
    });
  });
});
