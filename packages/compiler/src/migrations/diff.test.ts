import {
  createSchemaSql,
  emptySnapshot,
  schema,
  snapshotOf,
  t,
  table,
  index,
  type Column,
  type Schema,
} from "@forgeron/sdk/db";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { diffSnapshots, MigrationGenerationError } from "./diff";
import { structure } from "./structure";

// Each test goes from one schema to another and checks, on a real SQLite, what a migration promises:
// `up` leaves the structure of a database made from the new schema, keeps the rows, and `down` goes back.

function create(from: Schema | undefined): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  if (from) for (const sql of createSchemaSql(from)) db.exec(sql);
  return db;
}

const snap = (s: Schema | undefined) => (s ? snapshotOf(s) : emptySnapshot());

/** Applies the migration from `prev` to `next` on a database that has `rows`, and the way back. */
function migrate(
  prev: Schema | undefined,
  next: Schema | undefined,
  seed: (db: DatabaseSync) => void = () => {},
) {
  const diff = diffSnapshots(snap(prev), snap(next));
  const db = create(prev);
  seed(db);
  for (const sql of diff.statements) db.exec(sql);
  const up = structure(db);
  const down = diffSnapshots(snap(next), snap(prev));
  const downStatements = down.statements;
  for (const sql of downStatements) db.exec(sql);
  return {
    diff,
    db,
    up,
    expectedUp: structure(create(next)),
    afterDown: structure(db),
    expectedDown: structure(create(prev)),
    upStatements: diff.statements,
    downStatements,
  };
}

const companies = table("companies", { id: t.id(), name: t.text().notNull() });
const dealsV1 = table("deals", {
  id: t.id(),
  company_id: t.ref(companies).notNull(),
  title: t.text().notNull(),
});
const base = schema({ companies, deals: dealsV1 });
type AnyColumn = Column<any, any, any, any>;

const deals = (
  columns: Record<string, AnyColumn>,
  indexes?: (c: any) => Array<ReturnType<typeof index>>,
) =>
  table(
    "deals",
    {
      id: t.id(),
      company_id: t.ref(companies).notNull(),
      title: t.text().notNull(),
      ...columns,
    } as never,
    indexes as never,
  );

const seed = (db: DatabaseSync) => {
  db.exec("INSERT INTO companies (id, name) VALUES ('c1', 'Acme')");
  db.exec(
    "INSERT INTO deals (id, company_id, title) VALUES ('d1', 'c1', 'First'), ('d2', 'c1', 'Second')",
  );
};
const titles = (db: DatabaseSync) =>
  (db.prepare("SELECT title FROM deals ORDER BY id").all() as Array<{ title: string }>).map(
    (r) => r.title,
  );

describe("a schema that does not change", () => {
  it("gives no statement", () => {
    expect(diffSnapshots(snap(base), snap(base))).toEqual({ statements: [], destructive: false });
  });
});

describe("from nothing to a schema, and back", () => {
  const r = migrate(undefined, base);
  it("creates every table", () => {
    expect(r.up).toEqual(r.expectedUp);
    expect(Object.keys(r.up)).toEqual(["companies", "deals"]);
    expect(r.diff.destructive).toBe(false);
  });
  it("drops them again: destructive, and the tables that point at another go first", () => {
    expect(r.afterDown).toEqual({});
    expect(r.downStatements).toEqual(['DROP TABLE "deals"', 'DROP TABLE "companies"']);
    expect(diffSnapshots(snap(base), snap(undefined)).destructive).toBe(true);
  });
});

describe("a column added", () => {
  it("is an ALTER TABLE when SQLite allows it, and the rows are kept", () => {
    const next = schema({ companies, deals: deals({ notes: t.text() }) });
    const r = migrate(base, next, seed);
    expect(r.upStatements).toEqual(['ALTER TABLE "deals" ADD COLUMN "notes" TEXT']);
    expect(r.up).toEqual(r.expectedUp);
    expect(r.diff.destructive).toBe(false);
    expect(r.afterDown).toEqual(r.expectedDown);
  });

  it("with a constant default and NOT NULL fills the rows that exist", () => {
    const next = schema({ companies, deals: deals({ status: t.text().default("open") }) });
    const diff = diffSnapshots(snap(base), snap(next));
    expect(diff.statements).toEqual([
      `ALTER TABLE "deals" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'open'`,
    ]);
    const db = create(base);
    seed(db);
    for (const sql of diff.statements) db.exec(sql);
    expect(db.prepare("SELECT status FROM deals ORDER BY id").all()).toEqual([
      { status: "open" },
      { status: "open" },
    ]);
    expect(structure(db)).toEqual(structure(create(next)));
  });

  it("needs a rebuild when the default is the time, and keeps the rows", () => {
    const next = schema({
      companies,
      deals: table("deals", {
        id: t.id(),
        company_id: t.ref(companies).notNull(),
        title: t.text().notNull(),
        created_at: t.timestamp().defaultNow(),
      }),
    });
    const r = migrate(base, next, seed);
    expect(r.upStatements.some((s) => s.includes("__rebuild"))).toBe(true);
    expect(r.up).toEqual(r.expectedUp);
    expect(r.afterDown).toEqual(r.expectedDown);
  });
});

describe("a rebuild keeps the rows and the rest of the structure", () => {
  const leaf = (title: AnyColumn) => schema({ events: table("events", { id: t.id(), title }) });
  const seedEvents = (db: DatabaseSync) =>
    db.exec("INSERT INTO events (id, title) VALUES ('e1', 'a'), ('e2', 'b')");
  const rows = (db: DatabaseSync) =>
    db.prepare("SELECT id, title FROM events ORDER BY id").all() as Array<Record<string, string>>;

  it("when a column changes its nullability", () => {
    const r = migrate(leaf(t.text()), leaf(t.text().notNull()), seedEvents);
    expect(r.upStatements[0]).toContain('CREATE TABLE "events__rebuild"');
    expect(r.up).toEqual(r.expectedUp);
    expect(r.diff.destructive).toBe(false);
    expect(rows(r.db)).toEqual([
      { id: "e1", title: "a" },
      { id: "e2", title: "b" },
    ]);
    expect(r.afterDown).toEqual(r.expectedDown);
  });

  it("when an enum changes its values: the new value is accepted, and the way back refuses it again", () => {
    const a = schema({
      events: table("events", { id: t.id(), kind: t.enum(["a", "b"]).default("a") }),
    });
    const b = schema({
      events: table("events", { id: t.id(), kind: t.enum(["a", "b", "c"]).default("a") }),
    });
    const db = create(a);
    for (const sql of diffSnapshots(snap(a), snap(b)).statements) db.exec(sql);
    db.exec("INSERT INTO events (id, kind) VALUES ('e1', 'c')");
    expect(structure(db)).toEqual(structure(create(b)));
    db.exec("DELETE FROM events");
    for (const sql of diffSnapshots(snap(b), snap(a)).statements) db.exec(sql);
    expect(() => db.exec("INSERT INTO events (id, kind) VALUES ('e2', 'c')")).toThrow(/CHECK/);
  });

  it("when a unique column is added: SQLite cannot add it in place, and the constraint holds", () => {
    const next = schema({
      events: table("events", { id: t.id(), title: t.text(), slug: t.text().unique() }),
    });
    const r = migrate(leaf(t.text()), next, seedEvents);
    expect(r.upStatements.some((s) => s.includes("__rebuild"))).toBe(true);
    expect(r.up).toEqual(r.expectedUp);
  });

  it("when onUpdateNow is added: the trigger is recreated and works", () => {
    const a = schema({ events: table("events", { id: t.id(), at: t.timestamp() }) });
    const b = schema({
      events: table("events", { id: t.id(), at: t.timestamp().defaultNow().onUpdateNow() }),
    });
    const r = migrate(a, b);
    expect(r.up).toEqual(r.expectedUp);
    expect(r.up.events!.triggers).toEqual(["events_at_on_update"]);
  });

  it("is destructive when a column changes its kind", () => {
    const a = schema({ events: table("events", { id: t.id(), n: t.text() }) });
    const b = schema({ events: table("events", { id: t.id(), n: t.integer() }) });
    expect(diffSnapshots(snap(a), snap(b)).destructive).toBe(true);
  });
});

describe("a column or a table dropped", () => {
  it("is an ALTER TABLE DROP COLUMN, destructive, and the other columns keep their rows", () => {
    const withNotes = schema({ companies, deals: deals({ notes: t.text() }) });
    const r = migrate(withNotes, base, seed);
    expect(r.upStatements).toEqual(['ALTER TABLE "deals" DROP COLUMN "notes"']);
    expect(r.diff.destructive).toBe(true);
    expect(r.up).toEqual(r.expectedUp);
  });

  it("drops a table, destructively", () => {
    const only = schema({ companies });
    const r = migrate(base, only, seed);
    expect(r.upStatements).toEqual(['DROP TABLE "deals"']);
    expect(r.diff.destructive).toBe(true);
    expect(r.up).toEqual(r.expectedUp);
    expect(r.afterDown).toEqual(r.expectedDown);
  });
});

describe("indexes", () => {
  it("are added and dropped without touching the table", () => {
    const indexed = schema({ companies, deals: deals({}, (c) => [index(c.title)]) });
    const added = migrate(base, indexed, seed);
    expect(added.upStatements).toEqual(['CREATE INDEX "deals_title_index" ON "deals" ("title")']);
    expect(added.up).toEqual(added.expectedUp);
    expect(added.afterDown).toEqual(added.expectedDown);
    expect(diffSnapshots(snap(indexed), snap(base)).statements).toEqual([
      'DROP INDEX "deals_title_index"',
    ]);
  });
});

describe("a table that other tables point at", () => {
  it("is not rebuilt: dropping it would delete the rows of the tables that point at it", () => {
    const changed = table("companies", {
      id: t.id(),
      name: t.text().notNull(),
      country: t.text().notNull().unique(),
    });
    expect(() =>
      diffSnapshots(snap(base), snap(schema({ companies: changed, deals: dealsV1 }))),
    ).toThrow(MigrationGenerationError);
    expect(() =>
      diffSnapshots(snap(base), snap(schema({ companies: changed, deals: dealsV1 }))),
    ).toThrow(/other tables point at it/);
  });

  it("can still get a column added in place", () => {
    const next = schema({
      companies: table("companies", { id: t.id(), name: t.text().notNull(), country: t.text() }),
      deals: dealsV1,
    });
    const r = migrate(base, next, seed);
    expect(r.upStatements).toEqual(['ALTER TABLE "companies" ADD COLUMN "country" TEXT']);
    expect(titles(r.db)).toEqual(["First", "Second"]);
  });
});
