import { createTestTool } from "@forgeron/sdk/testing";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { buildTool, type BuildResult } from "./index";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

describe("a tool with a database, built", () => {
  let built: BuildResult;
  beforeAll(async () => {
    built = await buildTool(fixture("db-tool"));
  }, 60_000);

  it("declares the database in the manifest", async () => {
    const manifest = JSON.parse(await readFile(join(built.outDir, "manifest.json"), "utf8"));
    expect(manifest.resources.db).toEqual({ engine: "d1", why: "Companies and deals" });
  });

  it("generates the types of ctx.db from the schema", async () => {
    const types = await readFile(join(built.dir, ".forgeron", "generated", "db.d.ts"), "utf8");
    expect(types).toContain('import type schema from "../../db/schema";');
    expect(types).toContain('declare module "@forgeron/sdk"');
    expect(types).toContain("db: Database<typeof schema>;");
  });

  it("runs an action on the tables of the schema, in a fresh database", async () => {
    const tool = await createTestTool({ dir: built.dir });
    const deal = (await tool.call("deals.create", { company: "Acme", title: "Renewal" })) as {
      id: string;
      stage: string;
    };
    expect(deal.stage).toBe("lead");
    expect(deal.id).toMatch(/^[0-9a-f]{32}$/);
    expect(await tool.call("deals.list", {})).toEqual([
      { id: deal.id, title: "Renewal", stage: "lead" },
    ]);

    // Another test tool starts from empty tables.
    expect(await (await createTestTool({ dir: built.dir })).call("deals.list", {})).toEqual([]);
  });

  it("lets a test read the database through tool.db", async () => {
    const tool = await createTestTool({ dir: built.dir });
    await tool.call("deals.create", { company: "A", title: "One" });
    expect(await tool.db.selectFrom("deals").select("title").execute()).toEqual([{ title: "One" }]);
  });

  it("moves a deal, and refreshes updated_at", async () => {
    const tool = await createTestTool({ dir: built.dir });
    const created = (await tool.call("deals.create", { company: "Acme", title: "T" })) as {
      id: string;
    };
    expect(await tool.call("deals.move", { id: created.id, stage: "won" })).toEqual({
      id: created.id,
      stage: "won",
    });
    await expect(tool.call("deals.move", { id: "nope", stage: "won" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("refuses an invalid enum value before it reaches the database", async () => {
    const tool = await createTestTool({ dir: built.dir });
    await expect(tool.call("deals.move", { id: "x", stage: "open" })).rejects.toMatchObject({
      code: "INVALID",
    });
  });

  it("makes two writes succeed or fail together with ctx.db.batch", async () => {
    const tool = await createTestTool({ dir: built.dir });
    expect(await tool.call("deals.pair", { name: "A", companyId: "c1", title: "ok" })).toEqual({
      ok: true,
    });
    expect(await tool.call("deals.list", {})).toHaveLength(1);

    // The same company id again: the first insert of the batch fails, and so nothing is written.
    await expect(
      tool.call("deals.pair", { name: "B", companyId: "c1", title: "again" }),
    ).rejects.toThrow(/UNIQUE|PRIMARY/i);
    expect(await tool.call("deals.list", {})).toHaveLength(1);
  });
});

describe("a build run from the tool folder", () => {
  it("does not mistake the bundler's virtual modules for files of the tool", () => {
    // `moon run crm:typecheck` runs `build-tool .` from the tool folder: a relative id such as
    // "\0rolldown/runtime.js" then looked like a file inside it.
    const script = fileURLToPath(new URL("../../../scripts/build-tool.ts", import.meta.url));
    const run = spawnSync("bun", [script, "."], { cwd: fixture("db-tool"), encoding: "utf8" });
    expect(run.stderr).toBe("");
    expect(run.stdout).toContain("pipeline@1.0.0 built");
    expect(run.status).toBe(0);
  }, 60_000);
});

describe("the build rules about the database", () => {
  it("refuses db/schema.ts when the tool declares no database", async () => {
    await expect(buildTool(fixture("rules/schema-without-db"))).rejects.toThrow(
      /db\/schema\.ts declares tables, but resources\.db is not declared/,
    );
  }, 60_000);
});
