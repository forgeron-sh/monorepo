import type { D1Database } from "@forgeron/hosting";
import { describe, expect, it } from "vitest";
import { d1Entries, probeD1, withD1Stats } from "./d1-probe";

/** A database that says, as D1 does, how long the SQL took and who served it. */
function database() {
  const statement = (sql: string) => ({
    bind: () => statement(sql),
    all: async () => ({
      results: [],
      meta: { duration: 0.5, served_by_region: "WEUR", served_by_primary: true },
    }),
  });
  return {
    prepare: statement,
    batch: async (statements: unknown[]) =>
      statements.map(() => ({ meta: { duration: 1, served_by_region: "WEUR" } })),
  } as unknown as D1Database;
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
    expect(entries[0]).toMatch(/^d1;dur=\d+\.\d;desc="3 queries, added up"$/);
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
});
