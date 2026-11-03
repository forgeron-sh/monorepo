import { createTestTool } from "@forgeron/sdk/testing";
import { createMemoryD1 } from "@forgeron/sdk/testing/d1";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

describe("the seed of a built tool in a new preview", () => {
  type Worker = { default: { fetch(request: Request, env: unknown): Promise<Response> } };
  const SCHEMA =
    "CREATE TABLE companies (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT); " +
    "CREATE TABLE deals (id TEXT PRIMARY KEY, company_id TEXT, title TEXT, stage TEXT, updated_at TEXT); " +
    'CREATE TABLE "_forgeron_seed" ("status" TEXT NOT NULL, "detail" TEXT)';
  const user = JSON.stringify({ id: "u1", email: "a@b.c", name: "A", roles: ["sales"] });
  const call = (worker: Worker, env: unknown) =>
    worker.default.fetch(
      new Request("https://tool.test/api/deals.list", { headers: { "x-forgeron-user": user } }),
      env,
    );
  let loads = 0;
  // Each import is a new instance of the module: the state of an isolate is its own.
  const load = async () => {
    const built = await buildTool(fixture("db-tool"));
    return (await import(
      `${pathToFileURL(join(built.outDir, "worker.js")).href}?isolate=${++loads}`
    )) as Worker;
  };
  const withDb = async (status: string | undefined, run: (db: any) => Promise<void>) => {
    const db: any = await createMemoryD1();
    try {
      for (const sql of SCHEMA.split("; ")) await db.prepare(sql).all();
      if (status)
        await db.prepare(`INSERT INTO "_forgeron_seed" (status) VALUES (?)`).bind(status).all();
      await run(db);
    } finally {
      db.close();
    }
  };
  const names = async (db: any) =>
    ((await db.prepare("SELECT name FROM companies").all()).results as { name: string }[]).map(
      (r) => r.name,
    );
  const status = async (db: any) =>
    (await db.prepare(`SELECT status, detail FROM "_forgeron_seed"`).all()).results[0];

  it("runs on the first request, once, and then marks the seed done", async () => {
    const worker = await load();
    await withDb("pending", async (db) => {
      expect((await call(worker, { DB: db })).status).toBe(200);
      expect((await call(worker, { DB: db })).status).toBe(200);
      expect(await names(db)).toEqual(["Seeded Co"]);
      expect((await status(db)).status).toBe("done");
    });
  }, 60_000);

  it("does nothing without a marker, or once the seed is done", async () => {
    await withDb(undefined, async (db) => {
      await call(await load(), { DB: db });
      expect(await names(db)).toEqual([]);
    });
    await withDb("done", async (db) => {
      await call(await load(), { DB: db });
      expect(await names(db)).toEqual([]);
    });
  }, 60_000);

  it("lets two concurrent first requests seed once", async () => {
    await withDb("pending", async (db) => {
      const worker = await load();
      await Promise.all([call(worker, { DB: db }), call(worker, { DB: db })]);
      expect(await names(db)).toEqual(["Seeded Co"]);
    });
  }, 60_000);

  it("answers with the reason, and does not retry on half filled data, when the seed fails", async () => {
    await withDb("pending", async (db) => {
      await db.prepare("DROP TABLE companies").all();
      const worker = await load();
      const failed = await call(worker, { DB: db });
      expect(failed.status).toBe(500);
      expect(await failed.json()).toMatchObject({ error: { code: "SEED_FAILED" } });
      expect((await status(db)).status).toBe("failed");
      // Another isolate sees `failed` and answers the same, without running the seed again.
      const again = await call(await load(), { DB: db });
      expect(again.status).toBe(500);
    });
  }, 60_000);
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
