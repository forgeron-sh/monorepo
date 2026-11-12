import type { Manifest } from "@forgeron/manifest";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChangelogRefusal,
  createSelfHostHosting,
  deploy,
  MigrationError,
  teardownPreview,
  workerName,
  type Build,
  type BuildMigration,
  type D1Database,
  type Environment,
} from "../index";
import { FakeCloudflare } from "./fake-cloudflare";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const st = (sql: string) => ({ sql, parameters: [] });
const migration = (
  name: string,
  up: string,
  extra: Partial<BuildMigration> = {},
): BuildMigration => ({
  name,
  fingerprint: `fp-${name}`,
  up: [st(up)],
  down: [],
  destructive: false,
  ...extra,
});
const manifest = {
  resources: { db: { engine: "d1" }, cache: {}, files: { maxSize: "1MB", types: ["*/*"] } },
} as unknown as Manifest;
const build = (
  fingerprint: string,
  migrations: BuildMigration[],
  extra: Partial<Build> = {},
): Build => ({
  manifest,
  worker: `export default { fetch: () => new Response("${fingerprint}") }`,
  fingerprint,
  migrations,
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
  ...extra,
});
const production: Environment = { tool: "crm", name: "production" };

let memory: MemoryD1;
let cloud: FakeCloudflare;
let hosting: ReturnType<typeof createSelfHostHosting>;
let d1: D1Database;

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  cloud = new FakeCloudflare(() => d1);
  hosting = createSelfHostHosting({
    accountId: "acct",
    apiToken: "test-token",
    workspace: "acme",
    fetch: cloud.fetch,
    url: (name) => `https://${name}.example.test`,
  });
});
afterEach(() => memory.close());

const tables = async () =>
  (
    (
      await d1
        .prepare(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite%'`,
        )
        .all()
    ).results as { name: string }[]
  ).map((r) => r.name);

describe("names", () => {
  it("are stable per tool and environment", () => {
    expect(workerName("acme", production)).toBe("acme--crm--production");
    expect(workerName("acme", production)).toBe(workerName("acme", production));
  });

  it("tell previews of two branches apart and stay valid", () => {
    const a = workerName("acme", { tool: "crm", name: "preview", branch: "feat/Login Page" });
    const b = workerName("acme", { tool: "crm", name: "preview", branch: "feat/login-page!" });
    expect(a).not.toBe(b);
    const long = workerName("acme", { tool: "crm", name: "preview", branch: "x".repeat(200) });
    expect(long.length).toBeLessThanOrEqual(63);
    for (const name of [a, b, long]) expect(name).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
  });

  it("give a permanent channel its own Worker, apart from production and from a branch (D-125)", () => {
    const staging = workerName("acme", { tool: "crm", name: "channel", channel: "staging" });
    expect(staging).toBe("acme--crm--channel-staging");
    expect(staging).not.toBe(
      workerName("acme", { tool: "crm", name: "preview", branch: "staging" }),
    );
  });
});

describe("deploying to production", () => {
  it("provisions, uploads, migrates and activates, under stable names", async () => {
    const result = await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    expect(result.applied).toEqual(["0001"]);
    expect(result.activation.url).toBe("https://acme--crm--production.example.test");
    expect([...cloud.databases.values()].map((d) => d.name)).toEqual(["acme--crm--production--db"]);
    expect([...cloud.namespaces.values()]).toEqual(["acme--crm--production--cache"]);
    expect([...cloud.buckets]).toEqual(["acme--crm--production--files"]);
    const worker = cloud.workers.get("acme--crm--production")!;
    expect(worker.deployed).toBe(worker.versions[0]!.id);
    expect(worker.versions[0]!.body.bindings.map((b) => b.type)).toEqual([
      "d1",
      "kv_namespace",
      "r2_bucket",
    ]);
    expect(await tables()).toContain("a");
  });

  it("migrates before it switches traffic", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    const switched = cloud.calls.findIndex((c) => c.endsWith("/deployments"));
    const migrated = cloud.calls.findIndex((c) => c.endsWith("/query"));
    expect(migrated).toBeGreaterThan(-1);
    expect(migrated).toBeLessThan(switched);
  });

  it("reuses what exists the second time: same Worker, same database", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    const second = await deploy(
      hosting,
      production,
      build("v2", [
        migration("0001", "CREATE TABLE a (id INTEGER)"),
        migration("0002", "CREATE TABLE b (id INTEGER)"),
      ]),
    );
    expect(second.applied).toEqual(["0002"]);
    expect(cloud.databases.size).toBe(1);
    expect(cloud.workers.size).toBe(1);
    expect(cloud.workers.get("acme--crm--production")!.versions).toHaveLength(2);
    expect(cloud.calls.filter((c) => c === "POST /workers/workers")).toHaveLength(1);
  });

  it("keeps the previous version serving when a migration fails, and applies nothing of it", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    const worker = cloud.workers.get("acme--crm--production")!;
    const serving = worker.deployed;
    const deployments = cloud.calls.filter((c) => c.endsWith("/deployments")).length;

    const broken = build("v2", [
      migration("0001", "CREATE TABLE a (id INTEGER)"),
      {
        ...migration("0002", "CREATE TABLE b (id INTEGER)"),
        up: [st("CREATE TABLE b (id INTEGER)"), st("NOT SQL")],
      },
    ]);
    await expect(deploy(hosting, production, broken)).rejects.toMatchObject({
      name: "MigrationError",
      code: "FAILED",
      migration: "0002",
    });
    expect(worker.deployed).toBe(serving);
    expect(cloud.calls.filter((c) => c.endsWith("/deployments"))).toHaveLength(deployments);
    expect(await tables()).not.toContain("b");
  });

  it("refuses a destructive migration without the flag, and accepts it with it", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    const worker = cloud.workers.get("acme--crm--production")!;
    const serving = worker.deployed;
    const drop = build("v2", [
      migration("0001", "CREATE TABLE a (id INTEGER)"),
      migration("0002", "DROP TABLE a", { destructive: true }),
    ]);
    const refusal = await deploy(hosting, production, drop).catch((e: unknown) => e);
    expect(refusal).toBeInstanceOf(MigrationError);
    expect((refusal as MigrationError).code).toBe("DESTRUCTIVE");
    expect(worker.deployed).toBe(serving);
    expect(await tables()).toContain("a");

    await deploy(hosting, production, drop, { allowDestructive: true });
    expect(await tables()).not.toContain("a");
  });

  it("refuses a build without a changelog before touching the account", async () => {
    const bare = build("v1", [], { changelog: undefined });
    await expect(deploy(hosting, production, bare)).rejects.toBeInstanceOf(ChangelogRefusal);
    expect(cloud.calls).toEqual([]);
  });
});

describe("previews", () => {
  const preview: Environment = { tool: "crm", name: "preview", branch: "feat/login" };

  it("take a destructive migration and a build without changelog", async () => {
    const result = await deploy(
      hosting,
      preview,
      build(
        "p1",
        [
          migration("0001", "CREATE TABLE a (id INTEGER)"),
          migration("0002", "DROP TABLE a", { destructive: true }),
        ],
        {
          changelog: undefined,
        },
      ),
    );
    expect(result.applied).toEqual(["0001", "0002"]);
  });

  it("are torn down with their resources when the branch goes, and only theirs", async () => {
    await deploy(hosting, production, build("v1", []));
    await deploy(hosting, preview, build("p1", []));
    expect(cloud.workers.size).toBe(2);
    await teardownPreview(hosting, "crm", "feat/login");
    expect([...cloud.workers.keys()]).toEqual(["acme--crm--production"]);
    expect([...cloud.databases.values()].map((d) => d.name)).toEqual(["acme--crm--production--db"]);
    expect([...cloud.namespaces.values()]).toEqual(["acme--crm--production--cache"]);
    expect([...cloud.buckets]).toEqual(["acme--crm--production--files"]);
    // Again: nothing left, nothing fails.
    await teardownPreview(hosting, "crm", "feat/login");
  });
});

describe("the account", () => {
  it("answers an error that stops the deployment and says what failed", async () => {
    const refusing = createSelfHostHosting({
      accountId: "acct",
      apiToken: "test-token",
      workspace: "acme",
      fetch: async () =>
        Response.json({ success: false, errors: [{ message: "no" }] }, { status: 403 }),
      url: () => "",
    });
    await expect(deploy(refusing, production, build("v1", []))).rejects.toThrow(/403.*no/);
  });
});
