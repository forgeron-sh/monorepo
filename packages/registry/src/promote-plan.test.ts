import {
  applyMigrations,
  type Build,
  type BuildMigration,
  type D1Database,
  type Hosting,
} from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveVersion,
  createRegistry,
  deployBuild,
  migratePlatform,
  planPromotion,
  promoteVersion,
  type Registry,
  type Tool,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The plan of a promotion (D-112): read only, and it says every problem at once.

let memory: MemoryD1;
let registry: Registry;
let tool: Tool;
const opened: MemoryD1[] = [];
beforeEach(async () => {
  memory = await createMemoryD1();
  await migratePlatform(memory as unknown as D1Database);
  registry = createRegistry(memory as unknown as D1Database);
  tool = await registry.createTool({ workspace: "acme", name: "crm" });
});
afterEach(async () => {
  memory.close();
  for (const d of opened.splice(0)) d.close();
});

const st = (sql: string) => ({ sql, parameters: [] });
const migration = (name: string, extra: Partial<BuildMigration> = {}): BuildMigration => ({
  name,
  fingerprint: `fp-${name}`,
  up: [st(`CREATE TABLE "t_${name}" ("id" INTEGER)`)],
  down: [st(`DROP TABLE "t_${name}"`)],
  destructive: false,
  ...extra,
});

const manifestWith = (resources: Record<string, unknown>) =>
  ({
    name: "crm",
    version: "1.0.0",
    interfaces: { mcp: true, api: true, cli: true, web: true },
    roles: {},
    actions: {},
    views: {},
    jobs: {},
    events: {},
    resources,
    uses: {},
    preview: { data: "seed" },
  }) as unknown as Build["manifest"];

const build = (fingerprint: string, extra: Partial<Build> = {}): Build => ({
  manifest: manifestWith({ db: { engine: "d1" } }),
  worker: `// ${fingerprint}`,
  fingerprint,
  migrations: [migration("0001_init")],
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
  ...extra,
});

/** A host whose production database is the one given, as the real one reads it. */
function hostWith(production?: MemoryD1): Hosting {
  return {
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
    ...(production
      ? {
          openDatabase: async (environment: { name: string }) =>
            environment.name === "production" ? (production as unknown as D1Database) : undefined,
        }
      : {}),
  };
}

const deployTo = (
  hosting: Hosting,
  environment: "production" | "preview",
  b: Build,
  version: string,
  branch?: string,
) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(branch ? { branch } : {}),
    build: b,
    version,
    actor: "ely",
  });

/** The first production version: it asks for the database, so an admin approves it first. */
async function seedProduction(hosting: Hosting, b: Build, version: string) {
  await deployTo(hosting, "preview", b, version, "seed");
  const published = await registry.findVersion(tool.id, version);
  await approveVersion(registry, published!.id, "root");
  await promoteVersion(registry, hosting, { tool, version, to: "production", actor: "ely" });
}

async function productionDatabase(...applied: BuildMigration[]): Promise<MemoryD1> {
  const d = await createMemoryD1();
  opened.push(d);
  await applyMigrations(d as unknown as D1Database, applied, { allowDestructive: true });
  return d;
}

describe("planning a promotion", () => {
  it("says a branch can go when nothing stops it, with what would run and what changes", async () => {
    const init = migration("0001_init");
    const second = migration("0002_stage");
    const production = await productionDatabase(init);
    const hosting = hostWith(production);
    await seedProduction(hosting, build("fp1", { migrations: [init] }), "1.0.0");
    await deployTo(
      hosting,
      "preview",
      build("fp2", { migrations: [init, second] }),
      "1.1.0",
      "feature-x",
    );

    const plan = await planPromotion(registry, hosting, {
      tool,
      to: "production",
      fromBranch: "feature-x",
    });
    expect(plan).toMatchObject({
      tool: "crm",
      version: "1.1.0",
      from: { branch: "feature-x" },
      to: { environment: "production", currentVersion: "1.0.0" },
      alreadyServed: false,
      ok: true,
      conflicts: [],
      requiresAllowDestructive: false,
      migrations: { checked: true, applied: ["0001_init"], pending: ["0002_stage"] },
    });
    expect(plan.prompt).toBeUndefined();
  });

  it("gives every conflict at once, and a prompt that names them and sets the rules", async () => {
    // Another branch added 0002_other and went first; this branch has its own 0002_stage.
    const init = migration("0001_init");
    const other = migration("0002_other");
    const mine = migration("0002_stage");
    const production = await productionDatabase(init, other);
    const hosting = hostWith(production);
    await seedProduction(hosting, build("fp1", { migrations: [init, other] }), "1.0.0");
    await deployTo(
      hosting,
      "preview",
      build("fp2", { migrations: [init, mine], changelog: undefined as never }),
      "1.1.0",
      "feature-x",
    );

    const plan = await planPromotion(registry, hosting, {
      tool,
      to: "production",
      fromBranch: "feature-x",
    });
    expect(plan.ok).toBe(false);
    expect(plan.conflicts.map((c) => [c.code, c.subject])).toEqual([
      ["CHANGELOG_NO_ENTRY", undefined],
      ["MIGRATION_MISSING", "0002_other"],
    ]);
    const prompt = plan.prompt!;
    expect(prompt).toContain('"crm"');
    expect(prompt).toContain("feature-x");
    expect(prompt).toContain("MIGRATION_MISSING (0002_other)");
    expect(prompt).toContain("CHANGELOG_NO_ENTRY");
    expect(prompt).toContain("forgeron db status --env production");
    expect(prompt).toContain("never edit, delete or renumber a migration");
    expect(prompt).toContain("without showing it to me");
  });

  it("flags an edited migration and an out-of-order one", async () => {
    const init = migration("0001_init");
    const late = migration("0003_late");
    const production = await productionDatabase(init, late);
    const hosting = hostWith(production);
    await seedProduction(hosting, build("fp1", { migrations: [init, late] }), "1.0.0");
    const edited = { ...init, fingerprint: "changed" };
    await deployTo(
      hosting,
      "preview",
      build("fp2", { migrations: [edited, late, migration("0002_between")] }),
      "1.1.0",
      "b",
    );
    const plan = await planPromotion(registry, hosting, {
      tool,
      to: "production",
      fromBranch: "b",
    });
    expect(plan.conflicts.map((c) => c.code).sort()).toEqual([
      "MIGRATION_EDITED",
      "MIGRATION_OUT_OF_ORDER",
    ]);
  });

  it("asks for allowDestructive instead of calling a destructive migration a conflict", async () => {
    const init = migration("0001_init");
    const drop = migration("0002_drop", { destructive: true });
    const production = await productionDatabase(init);
    const hosting = hostWith(production);
    await seedProduction(hosting, build("fp1", { migrations: [init] }), "1.0.0");
    await deployTo(hosting, "preview", build("fp2", { migrations: [init, drop] }), "1.1.0", "b");
    const plan = await planPromotion(registry, hosting, {
      tool,
      to: "production",
      fromBranch: "b",
    });
    expect(plan.ok).toBe(true);
    expect(plan.requiresAllowDestructive).toBe(true);
    expect(plan.migrations.destructive).toEqual(["0002_drop"]);
  });

  it("lists a resource waiting for approval, and compares nothing it cannot read", async () => {
    const hosting = hostWith(); // no openDatabase: the target's database cannot be read
    await seedProduction(hosting, build("fp1"), "1.0.0");
    await deployTo(
      hosting,
      "preview",
      build("fp2", {
        manifest: manifestWith({
          db: { engine: "d1" },
          network: { allow: ["api.test"], why: "x" },
        }),
      }),
      "1.1.0",
      "b",
    );
    const plan = await planPromotion(registry, hosting, {
      tool,
      to: "production",
      fromBranch: "b",
    });
    expect(plan.migrations.checked).toBe(false);
    expect(plan.conflicts.map((c) => c.code)).toEqual(["PENDING_APPROVAL"]);
    expect(plan.changes.some((c) => c.needsApproval)).toBe(true);
  });

  it("plans by version number, says when it is already served, and refuses what does not exist", async () => {
    const hosting = hostWith(await productionDatabase(migration("0001_init")));
    await seedProduction(hosting, build("fp1"), "1.0.0");
    expect(
      await planPromotion(registry, hosting, { tool, to: "production", version: "1.0.0" }),
    ).toMatchObject({ alreadyServed: true, ok: true });
    await expect(
      planPromotion(registry, hosting, { tool, to: "production", version: "9.9.9" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      planPromotion(registry, hosting, { tool, to: "production", fromBranch: "ghost" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      planPromotion(registry, hosting, { tool, to: "production" }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("writes nothing: the target's database and the registry are as they were", async () => {
    const init = migration("0001_init");
    const production = await productionDatabase(init);
    const hosting = hostWith(production);
    await seedProduction(hosting, build("fp1", { migrations: [init] }), "1.0.0");
    await deployTo(
      hosting,
      "preview",
      build("fp2", { migrations: [init, migration("0002_x")] }),
      "1.1.0",
      "b",
    );
    const before = JSON.stringify(
      (await production.prepare(`SELECT * FROM "_forgeron_migrations"`).all()).results,
    );
    await planPromotion(registry, hosting, { tool, to: "production", fromBranch: "b" });
    expect(
      JSON.stringify(
        (await production.prepare(`SELECT * FROM "_forgeron_migrations"`).all()).results,
      ),
    ).toBe(before);
    const prod = (await registry.listEnvironments(tool.id)).find((e) => e.name === "production")!;
    expect((await registry.getVersion(prod.versionId!))!.version).toBe("1.0.0");
  });
});
