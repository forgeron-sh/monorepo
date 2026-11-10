import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyDatabase, CopyError } from "./branch-data";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memories: MemoryD1[] = [];
const open = async () => {
  const m = await createMemoryD1();
  memories.push(m);
  return m as unknown as D1Database;
};
beforeEach(() => {
  memories = [];
});
afterEach(() => memories.forEach((m) => m.close()));

/** A tool's database: its migrations' record, a parent table and a child that references it. */
async function toolDb(migrations = ["0001_init"]) {
  const db = await open();
  await db.batch([
    db.prepare(`CREATE TABLE "_forgeron_migrations" ("name" TEXT PRIMARY KEY, "fingerprint" TEXT)`),
    ...migrations.map((m) =>
      db.prepare(`INSERT INTO "_forgeron_migrations" VALUES (?, 'x')`).bind(m),
    ),
    db.prepare(`CREATE TABLE "companies" ("id" INTEGER PRIMARY KEY, "name" TEXT NOT NULL)`),
    db.prepare(
      `CREATE TABLE "contacts" ("id" INTEGER PRIMARY KEY, "company" INTEGER NOT NULL REFERENCES "companies" ("id"), "email" TEXT)`,
    ),
  ]);
  return db;
}
const all = async (db: D1Database, sql: string) =>
  ((await db.prepare(sql).all()).results ?? []) as Array<Record<string, unknown>>;

describe("copying a branch's data into another (D-121)", () => {
  it("replaces the target's rows by the source's, parents first, and leaves the platform's tables", async () => {
    const from = await toolDb();
    const to = await toolDb();
    await from.batch([
      from.prepare(`INSERT INTO "companies" VALUES (1, 'Acme'), (2, 'Globex')`),
      from.prepare(`INSERT INTO "contacts" VALUES (10, 2, 'a@globex.test'), (11, 1, NULL)`),
    ]);
    await to.batch([
      to.prepare(`INSERT INTO "companies" VALUES (9, 'Old')`),
      to.prepare(`INSERT INTO "contacts" VALUES (90, 9, 'old@old.test')`),
    ]);
    expect(await copyDatabase(from, to)).toEqual([
      { name: "companies", rows: 2 },
      { name: "contacts", rows: 2 },
    ]);
    expect(await all(to, `SELECT * FROM "companies" ORDER BY "id"`)).toEqual([
      { id: 1, name: "Acme" },
      { id: 2, name: "Globex" },
    ]);
    expect(await all(to, `SELECT * FROM "contacts" ORDER BY "id"`)).toEqual([
      { id: 10, company: 2, email: "a@globex.test" },
      { id: 11, company: 1, email: null },
    ]);
    expect(await all(to, `SELECT "name" FROM "_forgeron_migrations"`)).toEqual([
      { name: "0001_init" },
    ]);
  });

  it("refuses two databases on different migrations, and a source over the limit", async () => {
    const from = await toolDb(["0001_init", "0002_more"]);
    const to = await toolDb();
    await expect(copyDatabase(from, to)).rejects.toMatchObject({ code: "SCHEMA_DIFFERS" });

    const big = await toolDb();
    await big.prepare(`INSERT INTO "companies" VALUES (1, 'a'), (2, 'b'), (3, 'c')`).all();
    const error = await copyDatabase(big, await toolDb(), 2).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CopyError);
    expect(error).toMatchObject({ code: "TOO_LARGE" });
  });
});
