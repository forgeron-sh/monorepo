import { createDb, type D1Like } from "@forgeron/runtime";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMemoryD1 } from "../testing/memory-d1";
import { createSchemaSql, index, schema, sql, t, table, type Database } from "./index";

// The same scenario on the in-memory database of tests and on a real D1 (workerd, through
// Miniflare): what the schema generates has to work on both.

const companies = table("companies", {
  id: t.id(),
  name: t.text().notNull(),
  domain: t.text().unique(),
  created_at: t.timestamp().defaultNow(),
});
const deals = table(
  "deals",
  {
    id: t.id(),
    company_id: t.ref(companies).onDelete("cascade").notNull(),
    title: t.text().notNull(),
    stage: t.enum(["lead", "won", "lost"]).default("lead"),
    closed: t.boolean().default(false),
    meta: t.json(),
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.stage)],
);
const notes = table("notes", { id: t.id(), company_id: t.ref(companies).onDelete("set null") });
const crm = schema({ companies, deals, notes });

let mf: Miniflare;
afterAll(() => mf?.dispose());

const targets: Array<
  [string, () => Promise<D1Like & { exec?: (sql: string) => Promise<unknown> }>]
> = [
  ["in-memory database", async () => createMemoryD1()],
  [
    "D1 on workerd",
    async () => {
      mf = new Miniflare({
        modules: true,
        script: "export default { fetch() { return new Response('') } }",
        compatibilityDate: "2026-07-01",
        d1Databases: ["DB"],
      });
      return (await mf.getD1Database("DB")) as unknown as D1Like;
    },
  ],
];

describe.each(targets)("ctx.db on the %s", (_, open) => {
  let db: Database<typeof crm>;

  beforeAll(async () => {
    const d1 = await open();
    for (const statement of createSchemaSql(crm)) await d1.prepare(statement).all();
    db = createDb(d1) as unknown as Database<typeof crm>;
  });

  it("generates the id of a row: 32 hex characters, ordered by creation", async () => {
    const a = await db
      .insertInto("companies")
      .values({ name: "A" })
      .returning("id")
      .executeTakeFirstOrThrow();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const b = await db
      .insertInto("companies")
      .values({ name: "B" })
      .returning("id")
      .executeTakeFirstOrThrow();
    expect(a.id).toMatch(/^[0-9a-f]{32}$/);
    expect(a.id.slice(0, 12) <= b.id.slice(0, 12)).toBe(true);
    expect(a.id).not.toBe(b.id);
  });

  it("fills a default and the creation time, in ISO 8601 UTC", async () => {
    const company = await db
      .insertInto("companies")
      .values({ name: "Acme" })
      .returning(["id", "created_at"])
      .executeTakeFirstOrThrow();
    expect(company.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const deal = await db
      .insertInto("deals")
      .values({ company_id: company.id, title: "First deal" })
      .returning(["stage", "closed", "meta"])
      .executeTakeFirstOrThrow();
    expect(deal).toEqual({ stage: "lead", closed: 0, meta: null });
  });

  it("reads typed rows back", async () => {
    await db.insertInto("companies").values({ name: "Typed", domain: "typed.example" }).execute();
    const rows = await db
      .selectFrom("companies")
      .select(["name", "domain"])
      .where("domain", "=", "typed.example")
      .execute();
    expect(rows).toEqual([{ name: "Typed", domain: "typed.example" }]);
  });

  it("writes a boolean, and stores it as 0 or 1", async () => {
    const c = await db
      .insertInto("companies")
      .values({ name: "Bool" })
      .returning("id")
      .executeTakeFirstOrThrow();
    const deal = await db
      .insertInto("deals")
      .values({ company_id: c.id, title: "Closed", closed: true })
      .returning("closed")
      .executeTakeFirstOrThrow();
    expect(deal.closed).toBe(1);
  });

  it("refuses what the schema forbids: unique, enum, json, foreign key, not null", async () => {
    await db.insertInto("companies").values({ name: "U", domain: "u.example" }).execute();
    await expect(
      db.insertInto("companies").values({ name: "U2", domain: "u.example" }).execute(),
    ).rejects.toThrow(/UNIQUE/i);

    const c = await db
      .insertInto("companies")
      .values({ name: "Checks" })
      .returning("id")
      .executeTakeFirstOrThrow();
    await expect(
      sql`INSERT INTO deals (company_id, title, stage) VALUES (${c.id}, 'x', 'open')`.execute(db),
    ).rejects.toThrow(/CHECK/i);
    await expect(
      db.insertInto("deals").values({ company_id: c.id, title: "x", meta: "{not json" }).execute(),
    ).rejects.toThrow(/CHECK/i);
    await expect(
      db.insertInto("deals").values({ company_id: "nobody", title: "x" }).execute(),
    ).rejects.toThrow(/FOREIGN KEY/i);
    await expect(sql`INSERT INTO companies (name) VALUES (NULL)`.execute(db)).rejects.toThrow(
      /NOT NULL/i,
    );
  });

  it("accepts valid json text", async () => {
    const c = await db
      .insertInto("companies")
      .values({ name: "Json" })
      .returning("id")
      .executeTakeFirstOrThrow();
    const deal = await db
      .insertInto("deals")
      .values({ company_id: c.id, title: "x", meta: JSON.stringify({ a: 1 }) })
      .returning("meta")
      .executeTakeFirstOrThrow();
    expect(JSON.parse(deal.meta!)).toEqual({ a: 1 });
  });

  it("onDelete: a deal goes with its company, a note keeps living without it", async () => {
    const c = await db
      .insertInto("companies")
      .values({ name: "Gone" })
      .returning("id")
      .executeTakeFirstOrThrow();
    await db.insertInto("deals").values({ company_id: c.id, title: "d" }).execute();
    const note = await db
      .insertInto("notes")
      .values({ company_id: c.id })
      .returning("id")
      .executeTakeFirstOrThrow();
    await db.deleteFrom("companies").where("id", "=", c.id).execute();
    expect(
      await db.selectFrom("deals").select("id").where("company_id", "=", c.id).execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom("notes")
        .select("company_id")
        .where("id", "=", note.id)
        .executeTakeFirst(),
    ).toEqual({
      company_id: null,
    });
  });

  it("onUpdateNow: an update moves the time, unless it gives one", async () => {
    const c = await db
      .insertInto("companies")
      .values({ name: "Clock" })
      .returning("id")
      .executeTakeFirstOrThrow();
    const old = "2000-01-01T00:00:00.000Z";
    const deal = await db
      .insertInto("deals")
      .values({ company_id: c.id, title: "t", updated_at: old })
      .returning("id")
      .executeTakeFirstOrThrow();
    await db.updateTable("deals").set({ title: "renamed" }).where("id", "=", deal.id).execute();
    const after = await db
      .selectFrom("deals")
      .select("updated_at")
      .where("id", "=", deal.id)
      .executeTakeFirstOrThrow();
    expect(after.updated_at > old).toBe(true);

    const fixed = "2001-02-03T04:05:06.000Z";
    await db
      .updateTable("deals")
      .set({ title: "again", updated_at: fixed })
      .where("id", "=", deal.id)
      .execute();
    const kept = await db
      .selectFrom("deals")
      .select("updated_at")
      .where("id", "=", deal.id)
      .executeTakeFirstOrThrow();
    expect(kept.updated_at).toBe(fixed);
  });

  describe("batch", () => {
    it("runs the statements together and reports each", async () => {
      const results = await db.batch([
        db.insertInto("companies").values({ name: "Batch A" }),
        db.insertInto("companies").values({ name: "Batch B" }).returning("name"),
        db.selectFrom("companies").select("name").where("name", "like", "Batch %").orderBy("name"),
      ]);
      expect(results.map((r) => r.changes)).toEqual([1, 1, 0]);
      expect(results[1]!.rows).toEqual([{ name: "Batch B" }]);
      expect(results[2]!.rows).toEqual([{ name: "Batch A" }, { name: "Batch B" }]);
    });

    it("is all or nothing: a statement that fails undoes the ones before it", async () => {
      const company = await db
        .insertInto("companies")
        .values({ name: "Atomic" })
        .returning("id")
        .executeTakeFirstOrThrow();
      await expect(
        db.batch([
          db.insertInto("deals").values({ company_id: company.id, title: "kept?" }),
          db.insertInto("deals").values({ company_id: "nobody", title: "fails" }),
        ]),
      ).rejects.toThrow(/FOREIGN KEY/i);
      expect(
        await db.selectFrom("deals").select("id").where("title", "=", "kept?").execute(),
      ).toEqual([]);
    });

    it("does nothing for an empty list", async () => {
      expect(await db.batch([])).toEqual([]);
    });
  });

  it("has no interactive transaction: it says how to write atomically", async () => {
    await expect(db.transaction().execute(async () => {})).rejects.toThrow(/ctx\.db\.batch/);
  });
});
