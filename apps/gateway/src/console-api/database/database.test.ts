import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database, Hosting } from "@forgeron/hosting";
import { createSchemaSql, index, schema, t, table } from "@forgeron/sdk/db";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { platformCaller } from "../../platform/test-app";
import { assertSelect, rowsStatement, taggedColumns, type TableInfo } from "./sql";

// A database that refuses what D1 refuses: any read of a `_cf_*` table, and `pragma_*` on one,
// answers "not authorized" (the `_cf_KV` table every D1 database holds). Checked by SQLite's own
// authorizer, so a statement that touches such a table fails whatever its text.
async function createStrictD1() {
  const { DatabaseSync } = (await import("node:sqlite")) as unknown as {
    DatabaseSync: new (path: string) => {
      exec(sql: string): void;
      prepare(sql: string): { all(...params: unknown[]): unknown[] };
      setAuthorizer(
        callback: (action: number, p1: string | null, p2: string | null) => number,
      ): void;
      close(): void;
    };
  };
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const run = (sql: string, params: unknown[]) => ({ results: db.prepare(sql).all(...params) });
  const statement = (sql: string, params: unknown[]): unknown => ({
    sql,
    params,
    bind: (...values: unknown[]) => statement(sql, values),
    all: async () => run(sql, params),
  });
  return {
    prepare: (sql: string) => statement(sql, []),
    exec: (sql: string) => db.exec(sql),
    // After the setup: the authorizer would also refuse the statements that create `_cf_KV`.
    lock() {
      const SQLITE_READ = 20;
      const SQLITE_PRAGMA = 19;
      db.setAuthorizer((action, p1, p2) => {
        const refused =
          (action === SQLITE_READ && /^_cf_/.test(p1 ?? "")) ||
          (action === SQLITE_PRAGMA && /^_cf_/.test(p2 ?? ""));
        return refused ? 1 : 0;
      });
    },
    close: () => db.close(),
  };
}

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const companies = table("companies", {
  id: t.id(),
  name: t.text().notNull(),
  domain: t.text().unique(),
});
const contacts = table(
  "contacts",
  {
    id: t.id(),
    company_id: t.ref(companies).onDelete("set null"),
    label: t.text().notNull(),
    notes: t.text().personal(),
    email: t.text().unique(),
    visits: t.integer().default(0),
  },
  (c) => [index(c.label)],
);

let platform: MemoryD1;
let tool: MemoryD1;
let preview: MemoryD1;
let registry: Registry;
let caller: { admin: boolean; developer?: boolean; id?: string } | undefined;
let opened: string[] = [];
let slow = 0;

const hosting = {
  async openDatabase(environment: { name: string; branch?: string }) {
    opened.push(`${environment.name}${environment.branch ? `@${environment.branch}` : ""}`);
    if (slow) await new Promise((r) => setTimeout(r, slow));
    return (environment.name === "production" ? tool : preview) as unknown as D1Database;
  },
} as unknown as Hosting;

const app = (
  options: { timeoutMs?: number; hosting?: Hosting | undefined; registry?: Registry } = {},
) =>
  platformCaller({
    registry: options.registry ?? registry,
    who: () => caller,
    hosting: () => ("hosting" in options ? options.hosting : hosting),
    ...(options.timeoutMs ? { databaseTimeoutMs: options.timeoutMs } : {}),
  });
const call = (path: string, options: { timeoutMs?: number; hosting?: Hosting | undefined } = {}) =>
  app(options)(
    new Request(`https://acme.forgeron.test/api/tools/crm/db/${path}`),
  ) as Promise<Response>;
const get = async (path: string) => {
  const response = await call(path);
  return { status: response.status, body: (await response.json()) as any };
};
const filter = (...filters: object[]) => `filter=${encodeURIComponent(JSON.stringify(filters))}`;
const audit = async () =>
  (await registry.listAudit((await registry.findTool("acme", "crm"))!.id)).filter(
    (a) => a.kind === "access",
  );

beforeAll(async () => {
  platform = await createMemoryD1();
  await migratePlatform(platform as unknown as D1Database);
  registry = createRegistry(platform as unknown as D1Database);
  const created = await registry.createTool({ workspace: "acme", name: "crm" });
  const build = await registry.recordBuild(created.id, {
    fingerprint: "fp",
    manifest: { name: "crm" },
  });
  const version = await registry.publishVersion(created.id, build.id, "1.0.0");
  for (const [name, branch] of [["production"], ["preview", "feat-x"]] as const) {
    const env = await registry.ensureEnvironment(created.id, name, branch);
    await registry.activate(env.id, version.id, { actor: "test" });
  }
  tool = await createMemoryD1();
  preview = await createMemoryD1();
  for (const d1 of [tool, preview]) {
    for (const sql of createSchemaSql(schema({ companies, contacts }))) await d1.exec(sql);
    await d1.exec(`CREATE TABLE "_forgeron_migrations" ("name" TEXT)`);
  }
  await tool.exec(
    `INSERT INTO companies (id, name, domain) VALUES ('c1', 'Acme', 'acme.test'), ('c2', 'Globex', NULL)`,
  );
  for (let i = 1; i <= 120; i++) {
    await tool.exec(
      `INSERT INTO contacts (id, company_id, label, notes, email, visits) VALUES ('k${String(i).padStart(3, "0")}', 'c1', 'Person ${i}', 'secret note ${i}', 'p${i}@acme.test', ${i})`,
    );
  }
  await preview.exec(`INSERT INTO companies (id, name) VALUES ('p1', 'Preview Co')`);
});
afterAll(() => {
  platform.close();
  tool.close();
  preview.close();
});

const admin = () => (caller = { admin: true, developer: false, id: "mem_admin" });

describe("who may look", () => {
  it("refuses an anonymous caller, a plain member, and writes the refusal down", async () => {
    caller = undefined;
    expect((await get("tables")).status).toBe(401);
    caller = { admin: false, developer: false, id: "mem_plain" };
    expect((await get("tables")).status).toBe(403);
    expect((await audit()).some((a) => a.result === "denied" && a.subject === "db:tables")).toBe(
      true,
    );
    expect(opened).toEqual([]);
  });

  it("lets a developer in, but not reveal what is masked", async () => {
    caller = { admin: false, developer: true, id: "mem_dev" };
    expect((await get("tables")).status).toBe(200);
    expect((await get("tables/contacts/rows?reveal=1")).status).toBe(403);
  });

  it("ignores any other route", async () => {
    expect(await app()(new Request("https://x.test/api/tools/crm/db/nope"))).toBeUndefined();
  });

  it("answers a write method with 405", async () => {
    admin();
    const response = await app()(
      new Request("https://x.test/api/tools/crm/db/tables", { method: "POST" }),
    );
    expect(response!.status).toBe(405);
  });
});

describe("the tables", () => {
  it("lists the tool's own tables with their counts and hides the platform's", async () => {
    admin();
    const { body } = await get("tables");
    expect(body.tables).toEqual([
      { name: "companies", rows: 2, columns: 3 },
      { name: "contacts", rows: 120, columns: 6 },
    ]);
    const shown = (await get("tables?platform=1")).body;
    expect(shown.tables.map((x: { name: string }) => x.name)).toContain("_forgeron_migrations");
  });

  it("describes columns, constraints, indexes and foreign keys from SQLite itself", async () => {
    admin();
    const { body } = await get("tables/contacts");
    const columns = Object.fromEntries(body.table.columns.map((c: any) => [c.name, c]));
    expect(columns.id).toMatchObject({ primaryKey: true, notNull: true, type: "TEXT" });
    expect(columns.email).toMatchObject({ unique: true, notNull: false });
    expect(columns.label).toMatchObject({ notNull: true, unique: false });
    expect(columns.visits).toMatchObject({ kind: "integer", default: "0" });
    expect(columns.company_id.foreignKey).toEqual({ table: "companies", columns: ["id"] });
    expect(body.table.foreignKeys[0]).toMatchObject({
      columns: ["company_id"],
      onDelete: "SET NULL",
    });
    expect(body.table.indexes.map((i: any) => i.columns)).toContainEqual(["label"]);
    expect(body.table.rows).toBe(120);
  });

  it("gives the schema of every table with its relations", async () => {
    admin();
    const { body } = await get("schema");
    expect(body.tables.map((x: any) => x.name)).toEqual(["companies", "contacts"]);
    expect(body.tables[1].foreignKeys).toHaveLength(1);
  });

  it("reads a preview's own database, and only an environment the registry knows", async () => {
    admin();
    const preview = await get("tables?env=preview&branch=feat-x");
    expect(preview.body.tables[0]).toEqual({ name: "companies", rows: 1, columns: 3 });
    expect((await get("tables?env=preview&branch=nope")).status).toBe(404);
    expect((await get("tables?env=production&branch=feat-x")).status).toBe(404);
    expect((await get("tables?env=staging")).status).toBe(404);
  });

  it("answers 404 for a table the database does not have, 501 without a host that can read", async () => {
    admin();
    expect((await get("tables/ghosts")).status).toBe(404);
    expect((await call("tables", { hosting: undefined })).status).toBe(501);
  });
});

describe("the rows", () => {
  it("pages, with a total and a next page", async () => {
    admin();
    const first = (await get("tables/contacts/rows?limit=50")).body;
    expect(first).toMatchObject({ total: 120, page: 1, pageSize: 50, hasMore: true });
    expect(first.rows).toHaveLength(50);
    const last = (await get("tables/contacts/rows?limit=50&page=3")).body;
    expect(last.rows).toHaveLength(20);
    expect(last.hasMore).toBe(false);
    expect((await get("tables/contacts/rows?limit=500")).body.pageSize).toBe(100);
  });

  it("sorts, in both directions, with a stable order", async () => {
    admin();
    const names = async (dir: string) =>
      (await get(`tables/contacts/rows?sort=visits&dir=${dir}&limit=3`)).body.rows.map(
        (r: any[]) => r[0],
      );
    expect(await names("asc")).toEqual(["k001", "k002", "k003"]);
    expect(await names("desc")).toEqual(["k120", "k119", "k118"]);
  });

  it("filters with typed operators and counts the matches", async () => {
    admin();
    const found = (
      await get(`tables/contacts/rows?${filter({ column: "visits", op: "gte", value: 118 })}`)
    ).body;
    expect(found.total).toBe(3);
    const text = (
      await get(
        `tables/contacts/rows?${filter({ column: "label", op: "startsWith", value: "Person 11" })}`,
      )
    ).body;
    expect(text.total).toBe(11); // 11, 110 to 119
    const nulls = (await get(`tables/companies/rows?${filter({ column: "domain", op: "isNull" })}`))
      .body;
    expect(nulls.rows.map((r: any[]) => r[1])).toEqual(["Globex"]);
  });

  it("treats % and _ in a contains filter as text", async () => {
    admin();
    const body = (
      await get(`tables/contacts/rows?${filter({ column: "label", op: "contains", value: "%" })}`)
    ).body;
    expect(body.total).toBe(0);
  });

  it("masks the personal columns on the server: their values are never read", async () => {
    admin();
    const { body } = await get("tables/contacts/rows?limit=2");
    const at = (name: string) => body.columns.findIndex((c: any) => c.name === name);
    expect(body.rows[0][at("notes")]).toEqual({ masked: "tagged" });
    expect(body.rows[0][at("email")]).toEqual({ masked: "name" });
    expect(JSON.stringify(body)).not.toContain("secret note");
    expect(JSON.stringify(body)).not.toContain("@acme.test");
    expect(body.columns[at("notes")].masked).toBe("tagged");
  });

  it("refuses to sort or filter on a masked column, which would leak it", async () => {
    admin();
    for (const path of [
      "tables/contacts/rows?sort=email",
      `tables/contacts/rows?${filter({ column: "notes", op: "contains", value: "secret note 7" })}`,
    ]) {
      const { status, body } = await get(path);
      expect(status).toBe(400);
      expect(body.error).toBe("MASKED_COLUMN");
    }
  });

  it("shows the masked values to an admin who asks, and says so in the audit log", async () => {
    admin();
    const { body } = await get("tables/contacts/rows?limit=1&reveal=1&sort=visits");
    expect(body.rows[0][body.columns.findIndex((c: any) => c.name === "notes")]).toBe(
      "secret note 1",
    );
    const last = (await audit())[0]!;
    expect(last.detail).toMatchObject({ revealed: true });
  });

  it("exports CSV with the same masking, quoting and a guard against formulas", async () => {
    admin();
    await tool.exec(`INSERT INTO companies (id, name) VALUES ('c3', '=HYPERLINK("x"), "q"')`);
    const response = await call("tables/companies/export");
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="crm-companies.csv"',
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.has("x-forgeron-truncated")).toBe(false);
    const csv = await response.text();
    expect(csv.split("\r\n")[0]).toBe("id,name,domain");
    expect(csv).toContain(`"'=HYPERLINK(""x""), ""q"""`);
    const people = await (await call("tables/contacts/export")).text();
    expect(people.split("\r\n")[0]).toBe("id,company_id,label,visits");
    expect(people.split("\r\n")).toHaveLength(122 + 0); // header, 120 rows, trailing empty
    await tool.exec(`DELETE FROM companies WHERE id = 'c3'`);
  });
});

describe("it never writes, whatever it is sent", () => {
  const info: TableInfo = {
    name: "contacts",
    columns: ["id", "label", "visits"].map((name) => ({
      name,
      type: name === "visits" ? "INTEGER" : "TEXT",
      kind: name === "visits" ? "integer" : "text",
      notNull: false,
      primaryKey: name === "id",
      unique: false,
      default: null,
      masked: null,
    })),
  };
  const attacks = [
    `id"; DROP TABLE contacts; --`,
    `id" FROM contacts; DELETE FROM contacts; --`,
    `label) UNION SELECT notes FROM contacts --`,
    `1; DROP TABLE contacts`,
    "rowid",
  ];

  it.each(attacks)("refuses %j as a sort column, a filter column or a table", async (attack) => {
    admin();
    const before = (await get("tables")).body.tables;
    for (const path of [
      `tables/contacts/rows?sort=${encodeURIComponent(attack)}`,
      `tables/contacts/rows?${filter({ column: attack, op: "eq", value: "x" })}`,
      `tables/${encodeURIComponent(attack)}/rows`,
    ]) {
      expect([400, 404]).toContain((await get(path)).status);
    }
    expect((await get("tables")).body.tables).toEqual(before);
  });

  it("binds a hostile filter value instead of building it into the statement", async () => {
    admin();
    const value = `x' OR 1=1; DROP TABLE contacts; --`;
    const { status, body } = await get(
      `tables/contacts/rows?${filter({ column: "label", op: "eq", value })}`,
    );
    expect(status).toBe(200);
    expect(body.total).toBe(0);
    expect((await get("tables")).body.tables[1].rows).toBe(120);
    const statement = rowsStatement(info, {
      filters: [{ column: "label", op: "eq", value }],
      limit: 10,
      offset: 0,
    });
    expect(statement.sql).not.toContain("DROP");
    expect(statement.params).toContain(value);
  });

  it.each([
    ["a letter as a number", { column: "visits", op: "eq", value: "1 OR 1=1" }],
    ["an unknown operator", { column: "label", op: "; DROP TABLE x", value: "a" }],
    ["a text operator on a number", { column: "visits", op: "contains", value: "1" }],
    ["an object as a value", { column: "label", op: "eq", value: { $gt: "" } }],
    ["a missing value", { column: "label", op: "eq" }],
  ])("refuses %s", async (_name, bad) => {
    admin();
    expect((await get(`tables/contacts/rows?${filter(bad)}`)).status).toBe(400);
  });

  it("refuses bad paging and an offset past the cap", async () => {
    admin();
    for (const path of [
      "page=0",
      "page=-1",
      "page=1.5",
      "page=abc",
      "page=202",
      "limit=0",
      "limit=x",
    ]) {
      expect((await get(`tables/contacts/rows?${path}`)).status).toBe(400);
    }
    expect((await get("tables/contacts/rows?page=201&limit=50")).status).toBe(200);
    expect(
      (
        await get(
          `tables/contacts/rows?${filter(...Array(11).fill({ column: "id", op: "notNull" }))}`,
        )
      ).status,
    ).toBe(400);
  });

  it("builds only SELECT statements, and refuses anything else outright", () => {
    expect(() =>
      assertSelect({ sql: `SELECT "id" FROM "t" WHERE "a" = ?`, params: [1] }),
    ).not.toThrow();
    for (const sql of [
      `DELETE FROM "t"`,
      `INSERT INTO "t" VALUES (1)`,
      `UPDATE "t" SET "a" = 1`,
      `DROP TABLE "t"`,
      `PRAGMA writable_schema = 1`,
      `SELECT 1; DROP TABLE "t"`,
      `WITH x AS (SELECT 1) DELETE FROM "t"`,
      `SELECT 1 /* x */ ; SELECT 2`,
      `ATTACH DATABASE 'x' AS y`,
      ` -- \nDELETE FROM t`,
    ]) {
      expect(() => assertSelect({ sql, params: [] })).toThrow("Only a SELECT can be run.");
    }
  });
});

describe("limits and failures", () => {
  it("gives up on a slow database with a 504", async () => {
    admin();
    slow = 80;
    const response = await call("tables", { timeoutMs: 10 });
    slow = 0;
    expect(response.status).toBe(504);
  });

  it("does not repeat what the host said", async () => {
    admin();
    const broken = {
      openDatabase: async () => {
        throw new Error("Bearer cf-secret-token rejected");
      },
    } as unknown as Hosting;
    const response = await call("tables", { hosting: broken });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("cf-secret-token");
  });

  it("writes who, what, which environment and which page, before sending any data", async () => {
    admin();
    await get("tables/contacts/rows?env=production&page=2&limit=10");
    const last = (await audit())[0]!;
    expect(last).toMatchObject({
      actor: "mem_admin",
      interface: "web",
      kind: "access",
      subject: "db:rows:contacts",
      result: "ok",
    });
    expect(last.detail).toMatchObject({ environment: "production", page: 2 });
  });

  it("does not send data when the audit line cannot be written", async () => {
    admin();
    const failing = {
      ...registry,
      recordAudit: async () => {
        throw new Error("audit down");
      },
    } as unknown as Registry;
    const response = await app({ registry: failing })(
      new Request("https://x.test/api/tools/crm/db/tables"),
    );
    expect(response!.status).toBe(502);
    expect(await response!.text()).not.toContain("companies");
  });
});

describe("the personal tag", () => {
  it("reads it from the CREATE TABLE of the database", () => {
    const sql = `CREATE TABLE "x" ("id" TEXT PRIMARY KEY, "a" TEXT /* personal */, "b" TEXT DEFAULT 'a, /* personal */', "c b" TEXT CHECK ("c b" IN ('x', 'y')) /* personal */)`;
    expect([...taggedColumns(sql)]).toEqual(["a", "c b"]);
    expect(taggedColumns(null).size).toBe(0);
  });
});

describe("a database that holds D1's own tables", () => {
  const strict = async () => {
    const d1 = await createStrictD1();
    for (const sql of createSchemaSql(schema({ companies, contacts }))) d1.exec(sql);
    d1.exec(`CREATE TABLE "_forgeron_migrations" ("name" TEXT)`);
    d1.exec(`CREATE TABLE "_cf_KV" ("key" TEXT PRIMARY KEY, "value" BLOB) WITHOUT ROWID`);
    d1.exec(`CREATE TABLE "log" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "line" TEXT)`);
    d1.exec(`INSERT INTO "log" ("line") VALUES ('x')`); // creates `sqlite_sequence`
    d1.lock();
    return d1;
  };
  const withStrict = (d1: unknown): Hosting =>
    ({ openDatabase: async () => d1 as D1Database }) as unknown as Hosting;

  it("lists the tool's tables without touching `_cf_*` or `sqlite_*`", async () => {
    admin();
    const d1 = await strict();
    const response = await call("tables", { hosting: withStrict(d1) });
    expect(response.status).toBe(200);
    const names = ((await response.json()) as { tables: { name: string }[] }).tables.map(
      (x) => x.name,
    );
    expect(names).toEqual(["companies", "contacts", "log"]);
    d1.close();
  });

  it("counts with platform=1 whatever the host does with a compound statement", async () => {
    admin();
    const d1 = await strict();
    d1.exec(`DROP TABLE "_forgeron_migrations"`);
    d1.exec(
      `CREATE TABLE "_forgeron_migrations" ("name" TEXT PRIMARY KEY NOT NULL, "fingerprint" TEXT NOT NULL, "applied_at" TEXT NOT NULL)`,
    );
    // A host that refuses a statement with several terms: the counts are asked one table at a time.
    const picky = {
      prepare: (sql: string) => {
        if (/union/i.test(sql)) throw new Error("too many terms in compound SELECT");
        return (d1 as unknown as { prepare: (s: string) => unknown }).prepare(sql);
      },
    };
    const response = await call("tables?platform=1", { hosting: withStrict(picky) });
    expect(response.status).toBe(200);
    const names = ((await response.json()) as { tables: { name: string }[] }).tables.map(
      (x) => x.name,
    );
    expect(names).toEqual(["_forgeron_migrations", "companies", "contacts", "log"]);
    d1.close();
  });

  it("names the table whose count failed in the log, and not in the answer", async () => {
    admin();
    const d1 = await strict();
    const refusing = {
      prepare: (sql: string) => {
        if (sql.includes('"contacts"') && /COUNT/.test(sql)) throw new Error("boom");
        return (d1 as unknown as { prepare: (s: string) => unknown }).prepare(sql);
      },
    };
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await call("tables", { hosting: withStrict(refusing) });
    const written = JSON.stringify(log.mock.calls);
    log.mockRestore();
    expect(response.status).toBe(502);
    expect(written).toContain('"table":"contacts"');
    expect(await response.text()).not.toContain("contacts");
    d1.close();
  });

  it("describes a table and the schema", async () => {
    admin();
    const d1 = await strict();
    expect((await call("schema", { hosting: withStrict(d1) })).status).toBe(200);
    expect((await call("tables/contacts", { hosting: withStrict(d1) })).status).toBe(200);
    d1.close();
  });

  it("writes the cause of a failure of the host to the log, and not what must not leave", async () => {
    admin();
    const failing = Object.assign(
      new Error(
        "Cloudflare POST /d1/database/3e9fed11-9409-4b06-aa41-e5ad00148817/query failed (400): " +
          "not authorized: SQLITE_AUTH [7500] Bearer cf-secret-token",
      ),
      { status: 400 },
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await call("tables", {
      hosting: { openDatabase: async () => Promise.reject(failing) } as unknown as Hosting,
    });
    const written = JSON.stringify(log.mock.calls);
    log.mockRestore();
    expect(response.status).toBe(502);
    expect(written).toContain("not authorized: SQLITE_AUTH [7500]");
    expect(written).toContain("400");
    expect(written).not.toContain("3e9fed11");
    expect(written).not.toContain("cf-secret-token");
    expect(await response.text()).not.toContain("SQLITE_AUTH");
  });
});
