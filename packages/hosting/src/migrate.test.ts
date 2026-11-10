import { createMemoryD1 } from "@forgeron/sdk/testing/d1";
import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyMigrations,
  checkMigrations,
  migrationStatus,
  revertMigrations,
  type BuildMigration,
  type D1Database,
  type MigrationError,
} from "./index";

// The runner on the in-memory database of tests and on a real D1 (workerd, through Miniflare): the
// in-memory one is what the other suites rely on, so it must give the same answers.

let mf: Miniflare | undefined;
let d1: D1Database;

const targets: Array<[string, () => Promise<D1Database>]> = [
  ["the in-memory database", async () => (await createMemoryD1()) as unknown as D1Database],
  [
    "D1 on workerd",
    async () => {
      mf = new Miniflare({
        modules: true,
        script: "export default { fetch() { return new Response('') } }",
        compatibilityDate: "2026-07-01",
        d1Databases: ["DB"],
      });
      return (await mf.getD1Database("DB")) as unknown as D1Database;
    },
  ],
];

describe.each(targets)("migrations on %s", (_, open) => {
  beforeEach(async () => {
    d1 = await open();
  });
  afterEach(async () => {
    await mf?.dispose();
    mf = undefined;
  });

  const st = (sql: string, ...parameters: unknown[]) => ({ sql, parameters });
  const migration = (
    name: string,
    up: string[],
    down: string[],
    extra: Partial<BuildMigration> = {},
  ): BuildMigration => ({
    name,
    fingerprint: `fp-${name}`,
    up: up.map((sql) => st(sql)),
    down: down.map((sql) => st(sql)),
    destructive: false,
    ...extra,
  });

  const init = migration(
    "0001_init",
    ['CREATE TABLE "deals" ("id" INTEGER PRIMARY KEY, "title" TEXT NOT NULL)'],
    ['DROP TABLE "deals"'],
  );
  const addStage = migration(
    "0002_stage",
    ['ALTER TABLE "deals" ADD COLUMN "stage" TEXT'],
    ['ALTER TABLE "deals" DROP COLUMN "stage"'],
  );

  const tables = async () =>
    (
      (
        await d1
          .prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%' ORDER BY name",
          )
          .all()
      ).results as Array<{ name: string }>
    ).map((r) => r.name);
  const recorded = async () =>
    (await d1.prepare('SELECT name, fingerprint FROM "_forgeron_migrations" ORDER BY name').all())
      .results as Array<{ name: string; fingerprint: string }>;
  const failure = async (promise: Promise<unknown>) =>
    (await promise.catch((e: unknown) => e)) as MigrationError;

  describe("applyMigrations", () => {
    it("applies the pending migrations in the order of their names, and records each", async () => {
      // Given out of order.
      const result = await applyMigrations(d1, [addStage, init]);
      expect(result.applied).toEqual(["0001_init", "0002_stage"]);
      expect(await tables()).toEqual(["_forgeron_migrations", "deals"]);
      expect(await recorded()).toEqual([
        { name: "0001_init", fingerprint: "fp-0001_init" },
        { name: "0002_stage", fingerprint: "fp-0002_stage" },
      ]);
      await d1.prepare("INSERT INTO deals (id, title, stage) VALUES (1, 'a', 'won')").all();
    });

    it("applies only what is new the next time", async () => {
      await applyMigrations(d1, [init]);
      expect((await applyMigrations(d1, [init])).applied).toEqual([]);
      expect((await applyMigrations(d1, [init, addStage])).applied).toEqual(["0002_stage"]);
    });

    it("records the time", async () => {
      await applyMigrations(d1, [init], { now: () => new Date("2026-11-03T10:00:00Z") });
      const row = (await d1.prepare('SELECT applied_at FROM "_forgeron_migrations"').all())
        .results![0];
      expect(row).toEqual({ applied_at: "2026-11-03T10:00:00.000Z" });
    });

    it("sends the parameters of a statement: a data migration", async () => {
      const seed = {
        ...migration("0003_seed", [], []),
        up: [st("INSERT INTO deals (id, title) VALUES (?, ?)", 7, "seeded")],
      };
      await applyMigrations(d1, [init, seed]);
      expect((await d1.prepare("SELECT title FROM deals WHERE id = 7").all()).results).toEqual([
        { title: "seeded" },
      ]);
    });

    it("is atomic: a migration that fails leaves nothing of itself, nor its record, and stops there", async () => {
      const broken = migration(
        "0002_broken",
        ['ALTER TABLE "deals" ADD COLUMN "stage" TEXT', 'INSERT INTO "nope" VALUES (1)'],
        [],
      );
      const later = migration("0003_later", ['CREATE TABLE "later" ("id" INTEGER)'], []);
      const error = await failure(applyMigrations(d1, [init, broken, later]));
      expect(error).toMatchObject({
        name: "MigrationError",
        code: "FAILED",
        migration: "0002_broken",
      });
      expect(error.message).toContain("rolled back");
      // The first migration stayed; the broken one left neither its column nor its record; the next never ran.
      expect((await recorded()).map((r) => r.name)).toEqual(["0001_init"]);
      const columns = (await d1.prepare("PRAGMA table_info(deals)").all()).results as Array<{
        name: string;
      }>;
      expect(columns.map((c) => c.name)).toEqual(["id", "title"]);
      expect(await tables()).not.toContain("later");
    });

    it("refuses a migration whose file changed after it was applied", async () => {
      await applyMigrations(d1, [init]);
      const edited = { ...init, fingerprint: "changed" };
      expect(await failure(applyMigrations(d1, [edited]))).toMatchObject({
        code: "EDITED",
        migration: "0001_init",
      });
    });

    it("refuses a build that lacks a migration that was applied", async () => {
      await applyMigrations(d1, [init, addStage]);
      expect(await failure(applyMigrations(d1, [init]))).toMatchObject({
        code: "MISSING",
        migration: "0002_stage",
      });
    });

    it("refuses a new migration numbered before one that is applied", async () => {
      await applyMigrations(
        d1,
        [addStage].map((m) => ({ ...m, up: [], down: [] })),
      );
      const early = migration("0001_early", [], []);
      expect(await failure(applyMigrations(d1, [early, addStage]))).toMatchObject({
        code: "OUT_OF_ORDER",
        migration: "0001_early",
      });
    });

    describe("a destructive migration", () => {
      const drop = migration("0002_drop", ['ALTER TABLE "deals" DROP COLUMN "title"'], [], {
        destructive: true,
      });

      it("is refused unless allowed, before anything is applied", async () => {
        await applyMigrations(d1, [init]);
        const harmless = migration("0002_harmless", ['CREATE TABLE "x" ("id" INTEGER)'], []);
        const error = await failure(
          applyMigrations(d1, [init, harmless, { ...drop, name: "0003_drop" }]),
        );
        expect(error).toMatchObject({ code: "DESTRUCTIVE", migration: "0003_drop" });
        expect(error.message).toContain("--allow-destructive");
        // Not even the harmless one before it ran.
        expect((await recorded()).map((r) => r.name)).toEqual(["0001_init"]);
      });

      it("is applied when allowed", async () => {
        await applyMigrations(d1, [init]);
        expect(
          (await applyMigrations(d1, [init, drop], { allowDestructive: true })).applied,
        ).toEqual(["0002_drop"]);
      });
    });
  });

  describe("migrationStatus", () => {
    it("says what is applied and what is pending", async () => {
      await applyMigrations(d1, [init]);
      expect(await migrationStatus(d1, [init, addStage])).toEqual({
        applied: ["0001_init"],
        pending: ["0002_stage"],
      });
    });
  });

  describe("revertMigrations", () => {
    it("undoes the last migration, atomically, and forgets it", async () => {
      await applyMigrations(d1, [init, addStage]);
      expect(await revertMigrations(d1, [init, addStage])).toEqual(["0002_stage"]);
      const columns = (await d1.prepare("PRAGMA table_info(deals)").all()).results as Array<{
        name: string;
      }>;
      expect(columns.map((c) => c.name)).toEqual(["id", "title"]);
      expect((await recorded()).map((r) => r.name)).toEqual(["0001_init"]);
      // And it can be applied again.
      expect((await applyMigrations(d1, [init, addStage])).applied).toEqual(["0002_stage"]);
    });

    it("undoes several, newest first", async () => {
      await applyMigrations(d1, [init, addStage]);
      expect(await revertMigrations(d1, [init, addStage], { steps: 2 })).toEqual([
        "0002_stage",
        "0001_init",
      ]);
      expect(await tables()).toEqual(["_forgeron_migrations"]);
    });

    it("does nothing when nothing is applied", async () => {
      expect(await revertMigrations(d1, [init])).toEqual([]);
    });

    it("says when a migration has no way back", async () => {
      const oneWay = migration("0001_oneway", ['CREATE TABLE "t" ("id" INTEGER)'], []);
      await applyMigrations(d1, [oneWay]);
      expect(await failure(revertMigrations(d1, [oneWay]))).toMatchObject({
        code: "NOT_REVERSIBLE",
        migration: "0001_oneway",
      });
    });

    it("rolls back a way back that fails, and keeps the record", async () => {
      const bad = migration(
        "0001_bad",
        ['CREATE TABLE "t" ("id" INTEGER)'],
        ['DROP TABLE "t"', 'DROP TABLE "nope"'],
      );
      await applyMigrations(d1, [bad]);
      expect(await failure(revertMigrations(d1, [bad]))).toMatchObject({
        code: "FAILED",
        migration: "0001_bad",
      });
      expect(await tables()).toContain("t");
      expect((await recorded()).map((r) => r.name)).toEqual(["0001_bad"]);
    });
  });
  describe("checking without applying (D-112)", () => {
    it("says what would be applied and writes nothing, not even the tracking table", async () => {
      const check = await checkMigrations(d1, [init, addStage]);
      expect(check).toEqual({
        applied: [],
        pending: ["0001_init", "0002_stage"],
        destructive: [],
        conflicts: [],
      });
      expect(await tables()).not.toContain("_forgeron_migrations");
      expect(await tables()).not.toContain("deals");
    });

    it("lists the pending destructive ones", async () => {
      await applyMigrations(d1, [init]);
      const drop = migration("0002_drop", ['DROP TABLE "deals"'], [], { destructive: true });
      expect(await checkMigrations(d1, [init, drop])).toMatchObject({
        applied: ["0001_init"],
        pending: ["0002_drop"],
        destructive: ["0002_drop"],
        conflicts: [],
      });
    });

    it("gives every conflict at once, with the codes applyMigrations refuses with", async () => {
      // Production has 0001 and a 0003 from another branch; this build edited 0001, lacks 0003 and
      // brings a 0002 that now comes before an applied one.
      const other = migration(
        "0003_other",
        ['CREATE TABLE "o" ("id" INTEGER)'],
        ['DROP TABLE "o"'],
      );
      await applyMigrations(d1, [init, other]);
      const edited = { ...init, fingerprint: "changed" };
      const check = await checkMigrations(d1, [edited, addStage]);
      expect(check.conflicts).toEqual([
        expect.objectContaining({ code: "EDITED", migration: "0001_init" }),
        expect.objectContaining({ code: "MISSING", migration: "0003_other" }),
        expect.objectContaining({ code: "OUT_OF_ORDER", migration: "0002_stage" }),
      ]);
      // And applying says the same for the first one, in the same words.
      const refused = await failure(applyMigrations(d1, [edited, addStage]));
      expect(refused.message).toBe(check.conflicts[0]!.message);
    });
  });
});
