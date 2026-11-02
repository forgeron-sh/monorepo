import { describe, expect, expectTypeOf, it } from "vitest";
import type { Insertable, Selectable } from "kysely";
import { createSchemaSql, index, schema, t, table, unique, type DB } from "./index";

// The crm schema of docs/examples/01-crm.md.
const companies = table("companies", {
  id: t.id(),
  name: t.text().notNull(),
  domain: t.text().unique(),
  created_at: t.timestamp().defaultNow(),
});

const contacts = table(
  "contacts",
  {
    id: t.id(),
    company_id: t.ref(companies).onDelete("set null"),
    first_name: t.text().notNull(),
    last_name: t.text().notNull(),
    email: t.text().unique(),
    created_at: t.timestamp().defaultNow(),
  },
  (c) => [index(c.last_name)],
);

const deals = table(
  "deals",
  {
    id: t.id(),
    company_id: t.ref(companies).notNull(),
    title: t.text().notNull(),
    stage: t.enum(["lead", "won", "lost"]).default("lead"),
    amount: t.integer(),
    closed: t.boolean().default(false),
    meta: t.json(),
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.stage), unique([c.company_id, c.title])],
);

const crm = schema({ companies, contacts, deals });
type Crm = DB<typeof crm>;

describe("the types of a schema", () => {
  it("a column is nullable unless notNull() or a default says otherwise", () => {
    type Row = Selectable<Crm["contacts"]>;
    expectTypeOf<Row["first_name"]>().toEqualTypeOf<string>();
    expectTypeOf<Row["email"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Row["company_id"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Row["created_at"]>().toEqualTypeOf<string>();
  });

  it("an enum is the union of its values, and an integer a number", () => {
    type Row = Selectable<Crm["deals"]>;
    expectTypeOf<Row["stage"]>().toEqualTypeOf<"lead" | "won" | "lost">();
    expectTypeOf<Row["amount"]>().toEqualTypeOf<number | null>();
  });

  it("an insert may leave out the id, a default and a nullable column, and not the rest", () => {
    type New = Insertable<Crm["deals"]>;
    expectTypeOf<{ company_id: string; title: string }>().toExtend<New>();
    // @ts-expect-error title is required
    const missing: New = { company_id: "c1" };
    void missing;
    // @ts-expect-error the stage must be one of the values
    const badStage: New = { company_id: "c1", title: "x", stage: "open" };
    void badStage;
  });

  it("a boolean is read as 0 or 1 and written as a boolean", () => {
    expectTypeOf<Selectable<Crm["deals"]>["closed"]>().toEqualTypeOf<0 | 1>();
    expectTypeOf<{ company_id: string; title: string; closed: true }>().toExtend<
      Insertable<Crm["deals"]>
    >();
  });

  it("has one entry per table, by name", () => {
    expectTypeOf<keyof Crm>().toEqualTypeOf<"companies" | "contacts" | "deals">();
  });
});

describe("table()", () => {
  it("keeps the name, the columns and the indexes", () => {
    expect(contacts.name).toBe("contacts");
    expect(Object.keys(contacts.columns)).toEqual([
      "id",
      "company_id",
      "first_name",
      "last_name",
      "email",
      "created_at",
    ]);
    expect(contacts.indexes).toEqual([{ columns: ["last_name"], unique: false }]);
    expect(deals.indexes).toEqual([
      { columns: ["stage"], unique: false },
      { columns: ["company_id", "title"], unique: true },
    ]);
  });

  it.each(["Deals", "my-table", "1deals", ""])("refuses the table name %j", (name) => {
    expect(() => table(name, { id: t.id() })).toThrow(/is not a table name/);
  });

  it("refuses a column name that is not lower snake case", () => {
    expect(() => table("deals", { firstName: t.text() })).toThrow(
      /deals\.firstName is not a column name/,
    );
  });

  it("refuses a table with no column, or two ids", () => {
    expect(() => table("deals", {})).toThrow(/has no column/);
    expect(() => table("deals", { a: t.id(), b: t.id() })).toThrow(/more than one id/);
  });

  it("refuses an index on a column that does not exist", () => {
    expect(() =>
      table("deals", { id: t.id() }, (c) => [index({ column: "nope" } as unknown as typeof c.id)]),
    ).toThrow(/names "nope", which is not a column/);
  });

  it("refuses enum values that repeat, hold a quote, or do not contain the default", () => {
    expect(() => table("d", { s: t.enum(["a", "a"]) })).toThrow(/distinct/);
    expect(() => table("d", { s: t.enum(["a'b"]) })).toThrow(/without a quote/);
    expect(() => table("d", { s: t.enum(["a", "b"]).default("c" as "a") })).toThrow(/default "c"/);
  });

  it("refuses modifiers that do not fit the column", () => {
    expect(() => t.text().defaultNow()).toThrow(/timestamp and date/);
    expect(() => t.text().onUpdateNow()).toThrow(/timestamp/);
    expect(() => t.text().onDelete("cascade")).toThrow(/ref columns/);
  });
});

describe("schema()", () => {
  it("refuses a table listed under another name", () => {
    expect(() => schema({ people: companies })).toThrow(/listed as "people"/);
  });

  it("refuses a ref to a table that is not in the schema, or that has no id", () => {
    expect(() => schema({ contacts })).toThrow(/contacts\.company_id points at "companies"/);
    const tags = table("tags", { name: t.text() });
    const notes = table("notes", { tag: t.ref(tags) });
    expect(() => schema({ tags, notes })).toThrow(/has no id column/);
  });

  it("accepts a ref by name", () => {
    const a = table("a", { id: t.id() });
    const b = table("b", { a_id: t.ref("a") });
    expect(schema({ a, b }).tables.b).toBe(b);
  });
});

describe("createSchemaSql()", () => {
  const sql = createSchemaSql(crm);

  it("writes one statement per table, index and trigger, each on one line", () => {
    expect(sql).toHaveLength(3 + 3 + 1);
    expect(sql.every((statement) => !statement.includes("\n"))).toBe(true);
  });

  it("writes the columns of a table", () => {
    const [companiesSql] = sql;
    expect(companiesSql).toContain('CREATE TABLE "companies"');
    expect(companiesSql).toContain('"name" TEXT NOT NULL');
    expect(companiesSql).toContain('"domain" TEXT UNIQUE');
    expect(companiesSql).toContain(
      `"created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
    );
    expect(companiesSql).toMatch(/"id" TEXT PRIMARY KEY NOT NULL DEFAULT \(printf\('%012x'/);
  });

  it("writes references with what happens on delete", () => {
    const contactsSql = sql.find((s) => s.startsWith('CREATE TABLE "contacts"'))!;
    expect(contactsSql).toContain(
      '"company_id" TEXT REFERENCES "companies"("id") ON DELETE SET NULL',
    );
    const dealsSql = sql.find((s) => s.startsWith('CREATE TABLE "deals"'))!;
    expect(dealsSql).toContain('"company_id" TEXT NOT NULL REFERENCES "companies"("id")');
    expect(dealsSql).not.toMatch(/REFERENCES "companies"\("id"\) ON DELETE/);
  });

  it("writes checks for enums, booleans and json, and defaults", () => {
    const dealsSql = sql.find((s) => s.startsWith('CREATE TABLE "deals"'))!;
    expect(dealsSql).toContain(
      `"stage" TEXT NOT NULL DEFAULT 'lead' CHECK ("stage" IN ('lead', 'won', 'lost'))`,
    );
    expect(dealsSql).toContain('"closed" INTEGER NOT NULL DEFAULT 0 CHECK ("closed" IN (0, 1))');
    expect(dealsSql).toContain('"meta" TEXT CHECK (json_valid("meta"))');
    expect(dealsSql).toContain('"amount" INTEGER');
  });

  it("writes indexes, unique ones included", () => {
    expect(sql).toContain('CREATE INDEX "contacts_last_name_index" ON "contacts" ("last_name")');
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "deals_company_id_title_unique" ON "deals" ("company_id", "title")',
    );
  });

  it("writes the trigger of onUpdateNow()", () => {
    const trigger = sql.find((s) => s.startsWith("CREATE TRIGGER"))!;
    expect(trigger).toContain('"deals_updated_at_on_update" AFTER UPDATE ON "deals"');
    expect(trigger).toContain('WHEN NEW."updated_at" IS OLD."updated_at"');
  });

  it("quotes a string default", () => {
    const quoted = schema({ a: table("a", { v: t.text().default("it's") }) });
    expect(createSchemaSql(quoted)[0]).toContain(`DEFAULT 'it''s'`);
  });
});
