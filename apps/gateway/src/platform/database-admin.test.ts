import {
  applyMigrations,
  type Build,
  type BuildMigration,
  type D1Database,
  type Hosting,
} from "@forgeron/hosting";
import {
  approveVersion,
  createRegistry,
  deployBuild,
  migratePlatform,
  putOnChannel,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { singleStatement, writes } from "./database-admin";
import { ADMIN, describeRouteMatrix, MEMBER } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Operations on a tool's remote database (D-113): admins only, audited before they run, one statement.

let platform: MemoryD1;
let production: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined = ADMIN;
let call: (request: Request) => Promise<Response | undefined>;
let hosting: Hosting;

const st = (sql: string) => ({ sql, parameters: [] });
const init: BuildMigration = {
  name: "0001_init",
  fingerprint: "fp-init",
  up: [st(`CREATE TABLE "deals" ("id" INTEGER PRIMARY KEY, "title" TEXT)`)],
  down: [st(`DROP TABLE "deals"`)],
  destructive: false,
};
const second: BuildMigration = {
  name: "0002_stage",
  fingerprint: "fp-stage",
  up: [st(`ALTER TABLE "deals" ADD COLUMN "stage" TEXT`)],
  down: [],
  destructive: false,
};
const manifest = {
  name: "crm",
  version: "1.0.0",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  roles: {},
  actions: {},
  views: {},
  jobs: {},
  events: {},
  resources: { db: { engine: "d1" } },
  uses: {},
  preview: { data: "seed" },
} as unknown as Build["manifest"];
const build = (fingerprint: string, migrations: BuildMigration[]): Build => ({
  manifest,
  worker: `// ${fingerprint}`,
  fingerprint,
  migrations,
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
});

beforeAll(async () => {
  platform = await createMemoryD1();
  production = await createMemoryD1();
  await migratePlatform(platform as unknown as D1Database);
  registry = createRegistry(platform as unknown as D1Database);
  await applyMigrations(production as unknown as D1Database, [init]);
  await production
    .prepare(`INSERT INTO "deals" ("title") VALUES ('Acme renewal'), ('Beta pilot')`)
    .all();
  hosting = {
    async provision(environment) {
      return { environment, bindings: [] };
    },
    async upload(provisioned, b) {
      return { provisioned, build: b };
    },
    async migrate() {
      return { applied: [] };
    },
    async activate({ provisioned }) {
      return { url: `https://${provisioned.environment.name}.test` };
    },
    async teardown() {},
    openDatabase: async (environment) =>
      environment.name === "production" ? (production as unknown as D1Database) : undefined,
  };
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  // Production serves 1.0.0 with 0001 applied; its build also carries 0002, which is pending.
  await deployBuild(registry, hosting, {
    tool,
    environment: "preview",
    branch: "seed",
    build: build("fp1", [init, second]),
    version: "1.0.0",
    actor: "ci",
  });
  const version = (await registry.findVersion(tool.id, "1.0.0"))!;
  await approveVersion(registry, version.id, "root");
  await putOnChannel(registry, hosting, {
    tool,
    version: "1.0.0",
    to: "production",
    actor: "ci",
  });
  call = platformCaller({
    registry,
    who: () => person,
    hosting: () => hosting,
  });
});
afterAll(() => {
  platform.close();
  production.close();
});

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};
const url = (path: string) => `https://acme.forgeron.test${path}`;
const get = (path: string) => through(new Request(url(path)), ADMIN);
const query = (body: Record<string, unknown>, who: ConsolePerson | undefined = ADMIN) =>
  through(
    new Request(url("/api/tools/crm/db/query"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    who,
  );

const admin = {
  access: "admin" as const,
  call: through,
  forbidden: "The database operations are for admins.",
};
describeRouteMatrix({
  title: "GET the migrations of an environment",
  ...admin,
  method: "GET",
  path: "/api/tools/crm/db/migrations",
});
describeRouteMatrix({
  title: "POST a statement",
  ...admin,
  method: "POST",
  path: "/api/tools/crm/db/query",
  invalidMessage: "Invalid input.",
  valid: { sql: "SELECT 1" },
  invalid: [{}, { sql: "" }, { sql: 3 }, { sql: "SELECT 1", env: "pilot" }],
});

const auditOf = async () => {
  const tool = (await registry.findTool("acme", "crm"))!;
  return (await registry.listAudit(tool.id, { kind: "access" })).filter(
    (l) => l.subject.startsWith("db:q") || l.subject === "db:write",
  );
};

describe("the migrations of an environment", () => {
  it("say what is applied, what is pending and what disagrees, against the version served", async () => {
    const res = await get("/api/tools/crm/db/migrations");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      environment: "production",
      version: "1.0.0",
      applied: ["0001_init"],
      pending: ["0002_stage"],
      destructive: [],
      conflicts: [],
    });
  });

  it("answers 404 for a tool, an environment or a version that does not exist", async () => {
    expect((await get("/api/tools/ghost/db/migrations")).status).toBe(404);
    expect((await get("/api/tools/crm/db/migrations?env=preview&branch=ghost")).status).toBe(404);
    // The preview exists but its database is not reachable here: no database.
    expect((await get("/api/tools/crm/db/migrations?env=preview&branch=seed")).status).toBe(404);
  });
});

describe("a statement on an environment's database", () => {
  it("reads, returns the rows, and records a hash and a length but not the text", async () => {
    const res = await query({ sql: "SELECT title FROM deals ORDER BY id" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      write: false,
      rows: [{ title: "Acme renewal" }, { title: "Beta pilot" }],
      rowCount: 2,
      truncated: false,
    });
    const line = (await auditOf())[0]!;
    expect(line).toMatchObject({ subject: "db:query", actor: "p-admin" });
    const detail = JSON.stringify(line.detail);
    expect(detail).toContain("sha256");
    expect(detail).not.toContain("SELECT title");
    expect(detail).not.toContain("Acme renewal");
  });

  it("refuses a write that was not asked for, and a write on production without the tool's name", async () => {
    const sql = `UPDATE deals SET title = 'Renamed' WHERE id = 1`;
    const unasked = await query({ sql });
    expect(unasked.status).toBe(422);
    expect(await unasked.json()).toMatchObject({ error: "WRITE_REQUIRED" });
    const unconfirmed = await query({ sql, write: true });
    expect(unconfirmed.status).toBe(409);
    expect(await unconfirmed.json()).toMatchObject({ error: "CONFIRM_REQUIRED" });
    const wrong = await query({ sql, write: true, confirm: "another" });
    expect(wrong.status).toBe(409);
    expect(
      (await production.prepare(`SELECT title FROM deals WHERE id = 1`).all()).results,
    ).toEqual([{ title: "Acme renewal" }]);
  });

  it("writes when asked and confirmed, and the audit line keeps the statement, written first", async () => {
    const sql = `UPDATE deals SET title = 'Renamed' WHERE id = 1`;
    const res = await query({ sql, write: true, confirm: "crm" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ write: true });
    expect(
      (await production.prepare(`SELECT title FROM deals WHERE id = 1`).all()).results,
    ).toEqual([{ title: "Renamed" }]);
    const line = (await auditOf())[0]!;
    expect(line).toMatchObject({ subject: "db:write", actor: "p-admin" });
    expect(JSON.stringify(line.detail)).toContain("UPDATE deals SET title");
  });

  it("takes a WITH that writes for a write, and more than one statement for none", async () => {
    const hidden = `WITH x AS (SELECT 1) DELETE FROM deals WHERE id = 2`;
    expect(writes(hidden)).toBe(true);
    expect(writes(`WITH x AS (SELECT 1) SELECT * FROM x`)).toBe(false);
    expect((await query({ sql: hidden })).status).toBe(422);
    expect((await query({ sql: "SELECT 1; DELETE FROM deals" })).status).toBe(400);
    expect(singleStatement("SELECT 1;")).toBe("SELECT 1");
    expect(singleStatement("SELECT 1; SELECT 2")).toBeUndefined();
    expect(singleStatement("  ;  ")).toBeUndefined();
    expect((await production.prepare(`SELECT COUNT(*) AS n FROM deals`).all()).results).toEqual([
      { n: 2 },
    ]);
  });

  it("answers what the database said when a statement fails, and records the failure", async () => {
    const res = await query({ sql: "SELECT * FROM nowhere" });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("STATEMENT_FAILED");
    expect(body.message).toContain("nowhere");
    expect((await auditOf()).some((l) => l.result === "error")).toBe(true);
  });

  it("needs a branch for a preview, a known environment and a tool that exists", async () => {
    expect((await query({ sql: "SELECT 1", env: "preview" })).status).toBe(400);
    expect((await query({ sql: "SELECT 1", env: "preview", branch: "ghost" })).status).toBe(404);
    const missing = await through(
      new Request(url("/api/tools/ghost/db/query"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql: "SELECT 1" }),
      }),
      ADMIN,
    );
    expect(missing.status).toBe(404);
  });

  it("is for admins: a member is refused and nothing runs or is recorded", async () => {
    const before = (await auditOf()).length;
    expect((await query({ sql: "SELECT 1" }, MEMBER)).status).toBe(403);
    const anonymous = await through(
      new Request(url("/api/tools/crm/db/query"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql: "SELECT 1" }),
      }),
      undefined,
    );
    expect(anonymous.status).toBe(401);
    expect((await auditOf()).length).toBe(before);
  });

  it("does not run a statement it could not record", async () => {
    const broken = platformCaller({
      registry: {
        ...registry,
        recordAudit: async () => {
          throw new Error("audit is down");
        },
      } as Registry,
      who: () => ADMIN,
      hosting: () => hosting,
    });
    const res = (await broken(
      new Request(url("/api/tools/crm/db/query"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql: "SELECT 1" }),
      }),
    ))!;
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "AUDIT_FAILED" });
  });

  it("caps the rows it returns", async () => {
    await production
      .prepare(
        `WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 1500) INSERT INTO deals (title) SELECT 'row' || i FROM n`,
      )
      .all();
    const res = await query({ sql: "SELECT id FROM deals" });
    const body = (await res.json()) as { rows: unknown[]; rowCount: number; truncated: boolean };
    expect(body.rows).toHaveLength(1000);
    expect(body.rowCount).toBeGreaterThan(1000);
    expect(body.truncated).toBe(true);
  });
});
