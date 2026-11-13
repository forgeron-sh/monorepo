import type { D1Database } from "@forgeron/hosting";
import { describe, expect, it } from "vitest";
import { d1Entries, probeD1, withD1Stats } from "./d1-probe";

/** A database that says, as D1 does, how long the SQL took and who served it. */
function database() {
  const sent: string[][] = [];
  const statement = (sql: string) => ({
    sql,
    bind: () => statement(sql),
    all: async () => {
      if (sql.includes("broken")) throw new Error("no such table");
      sent.push([sql]);
      return {
        results: [{ sql }],
        meta: { duration: 0.5, served_by_region: "WEUR", served_by_primary: true },
      };
    },
  });
  return Object.assign(
    {
      prepare: statement,
      batch: async (statements: Array<{ sql: string }>) => {
        if (statements.some((s) => s.sql.includes("broken"))) throw new Error("no such table");
        sent.push(statements.map((s) => s.sql));
        return statements.map((s) => ({
          results: [{ sql: s.sql }],
          meta: { duration: 1, served_by_region: "WEUR" },
        }));
      },
    } as unknown as D1Database,
    { sent },
  );
}

describe("what D1 costs a call (D-143)", () => {
  it("counts what it is asked, the SQL's own time and where it was served", async () => {
    const d1 = probeD1(database());
    const stats = await withD1Stats(async (s) => {
      await d1.prepare("SELECT 1").bind().all();
      await d1.prepare("SELECT 2").all();
      await d1.batch([d1.prepare("INSERT 1").bind()]);
      return s;
    });
    expect(stats.queries).toBe(3);
    expect(stats.sqlMs).toBeCloseTo(2);
    const entries = d1Entries(stats);
    expect(entries[0]).toMatch(/^d1;dur=\d+\.\d;desc="3 trips, 3 statements, added up"$/);
    expect(entries).toContain("d1.sql;dur=2.0");
    expect(entries.at(-1)).toBe('d1.where;dur=0;desc="WEUR primary and WEUR replica"');
  });

  it("tells nothing of a call that did not ask", async () => {
    const stats = await withD1Stats(async (s) => s);
    expect(d1Entries(stats)).toEqual([]);
  });

  it("keeps two calls apart and works outside any scope", async () => {
    const d1 = probeD1(database());
    await d1.prepare("SELECT 1").all();
    const [a, b] = await Promise.all([
      withD1Stats(async (s) => (await d1.prepare("x").all(), s)),
      withD1Stats(async (s) => (await d1.prepare("y").all(), await d1.prepare("z").all(), s)),
    ]);
    expect([a.queries, b.queries]).toEqual([1, 2]);
  });

  describe("the reads of a turn, together (D-146)", () => {
    it("sends the reads a call starts together in one batch, each given its own rows", async () => {
      const db = database();
      const d1 = probeD1(db, { together: true });
      const stats = await withD1Stats(async (s) => {
        const [a, b, c] = await Promise.all([
          d1.prepare("SELECT a").bind(1).all(),
          d1.prepare("select b").all(),
          d1.prepare("  SELECT c").all(),
        ]);
        expect(
          [a, b, c].map((r) => (r as { results: Array<{ sql: string }> }).results[0]!.sql),
        ).toEqual(["SELECT a", "select b", "  SELECT c"]);
        return s;
      });
      expect(db.sent).toEqual([["SELECT a", "select b", "  SELECT c"]]);
      expect([stats.trips, stats.queries]).toEqual([1, 3]);
    });

    it("sends a write at once, and a read alone as it is", async () => {
      const db = database();
      const d1 = probeD1(db, { together: true });
      await d1.prepare("UPDATE t SET x = 1").all();
      await d1.prepare("WITH x AS (SELECT 1) INSERT INTO t SELECT * FROM x").all();
      await d1.prepare("SELECT alone").all();
      expect(db.sent).toEqual([
        ["UPDATE t SET x = 1"],
        ["WITH x AS (SELECT 1) INSERT INTO t SELECT * FROM x"],
        ["SELECT alone"],
      ]);
    });

    it("fails only the read that fails, when the batch it was in fails", async () => {
      const db = database();
      const d1 = probeD1(db, { together: true });
      const [good, bad] = await Promise.allSettled([
        d1.prepare("SELECT good").all(),
        d1.prepare("SELECT broken").all(),
      ]);
      expect(good.status).toBe("fulfilled");
      expect(bad.status).toBe("rejected");
    });

    it("keeps the reads of two calls in two batches", async () => {
      const db = database();
      const d1 = probeD1(db, { together: true });
      await Promise.all([
        withD1Stats(async () =>
          Promise.all([d1.prepare("SELECT a1").all(), d1.prepare("SELECT a2").all()]),
        ),
        withD1Stats(async () =>
          Promise.all([d1.prepare("SELECT b1").all(), d1.prepare("SELECT b2").all()]),
        ),
      ]);
      expect(db.sent.map((s) => s.join()).sort()).toEqual([
        "SELECT a1,SELECT a2",
        "SELECT b1,SELECT b2",
      ]);
    });
  });
});
