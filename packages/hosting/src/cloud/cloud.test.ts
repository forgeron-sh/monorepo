import type { Manifest } from "@forgeron/manifest";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChangelogRefusal,
  createCloudHosting,
  deploy,
  MigrationError,
  restore,
  teardownPreview,
  type Build,
  type BuildMigration,
  type D1Database,
  type Environment,
} from "../index";
import { FakeCloudflare } from "../self-host/fake-cloudflare";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const st = (sql: string) => ({ sql, parameters: [] });
const migration = (name: string, up: string): BuildMigration => ({
  name,
  fingerprint: `fp-${name}`,
  up: [st(up)],
  down: [],
  destructive: false,
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
const SCRIPT = "forgeron-tools/acme--crm--production";

let memory: MemoryD1;
let cloudflare: FakeCloudflare;
let hosting: ReturnType<typeof createCloudHosting>;
let d1: D1Database;

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  cloudflare = new FakeCloudflare(() => d1);
  hosting = createCloudHosting({
    accountId: "acct",
    apiToken: "test-token",
    workspace: "acme",
    namespace: "forgeron-tools",
    fetch: cloudflare.fetch,
    url: (name) => `https://acme.forgeron.test/${name}`,
  });
});
afterEach(() => memory.close());

const tables = async () =>
  (
    (await d1.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all()).results as {
      name: string;
    }[]
  ).map((r) => r.name);

describe("deploying to production in the cloud", () => {
  it("uploads the Worker to the dispatch namespace, with its own D1, KV and R2 declared at upload", async () => {
    const result = await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    expect(result.applied).toEqual(["0001"]);
    expect(result.activation.url).toBe("https://acme.forgeron.test/acme--crm--production");
    expect([...cloudflare.databases.values()].map((d) => d.name)).toEqual([
      "acme--crm--production--db",
    ]);
    expect([...cloudflare.namespaces.values()]).toEqual(["acme--crm--production--cache"]);
    expect([...cloudflare.buckets]).toEqual(["acme--crm--production--files"]);

    const uploaded = cloudflare.scripts.get(SCRIPT)!;
    expect(uploaded.modules["worker.js"]).toContain('new Response("v1")');
    expect(uploaded.metadata).toMatchObject({ main_module: "worker.js" });
    const [db, kv, r2] = uploaded.metadata.bindings;
    expect(db).toMatchObject({ type: "d1", name: "DB", id: [...cloudflare.databases.keys()][0] });
    expect(kv).toMatchObject({
      type: "kv_namespace",
      name: "CACHE",
      namespace_id: [...cloudflare.namespaces.keys()][0],
    });
    expect(r2).toEqual({
      type: "r2_bucket",
      name: "FILES",
      bucket_name: "acme--crm--production--files",
    });
    // No classic Worker is created: the script lives in the namespace only.
    expect(cloudflare.workers.size).toBe(0);
    expect(await tables()).toContain("a");
  });

  it("migrates before the script is sent", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    const calls = cloudflare.calls;
    const put = calls.findIndex((c) => c.startsWith("PUT /workers/dispatch/"));
    const query = calls.findIndex((c) => c.endsWith("/query"));
    expect(query).toBeGreaterThan(-1);
    expect(query).toBeLessThan(put);
  });

  it("leaves the previous script serving when a migration fails", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    await expect(
      deploy(
        hosting,
        production,
        build("v2", [
          migration("0001", "CREATE TABLE a (id INTEGER)"),
          migration("0002", "THIS IS NOT SQL"),
        ]),
      ),
    ).rejects.toBeInstanceOf(MigrationError);
    expect(cloudflare.scripts.get(SCRIPT)!.modules["worker.js"]).toContain('"v1"');
  });

  it("replaces the script of an environment in place, under the same name", async () => {
    await deploy(hosting, production, build("v1", []));
    await deploy(hosting, production, build("v2", []));
    expect([...cloudflare.scripts.keys()]).toEqual([SCRIPT]);
    expect(cloudflare.scripts.get(SCRIPT)!.modules["worker.js"]).toContain('"v2"');
    expect(cloudflare.databases.size).toBe(1);
  });

  it("restores an earlier build without migrating", async () => {
    await deploy(
      hosting,
      production,
      build("v1", [migration("0001", "CREATE TABLE a (id INTEGER)")]),
    );
    cloudflare.calls.length = 0;
    await restore(hosting, production, build("v0", []));
    expect(cloudflare.calls.some((c) => c.endsWith("/query"))).toBe(false);
    expect(cloudflare.scripts.get(SCRIPT)!.modules["worker.js"]).toContain('"v0"');
  });

  it("refuses production without a changelog entry, before touching the account", async () => {
    await expect(
      deploy(hosting, production, build("v1", [], { changelog: undefined })),
    ).rejects.toBeInstanceOf(ChangelogRefusal);
    expect(cloudflare.calls).toEqual([]);
  });

  it("does not declare a resource the manifest did not ask for", async () => {
    const bare = { resources: {} } as unknown as Manifest;
    await deploy(hosting, production, build("v1", [], { manifest: bare }));
    expect(cloudflare.scripts.get(SCRIPT)!.metadata.bindings).toEqual([]);
    expect(cloudflare.databases.size).toBe(0);
  });
});

describe("tearing down a preview in the cloud", () => {
  const branch = { tool: "crm", name: "preview", branch: "feat/export" } as const;

  it("deletes the script and everything it owned, and can be repeated", async () => {
    await deploy(hosting, branch, build("p1", []));
    expect(cloudflare.scripts.size).toBe(1);
    await teardownPreview(hosting, "crm", "feat/export");
    expect(cloudflare.scripts.size).toBe(0);
    expect(cloudflare.databases.size + cloudflare.namespaces.size + cloudflare.buckets.size).toBe(
      0,
    );
    await teardownPreview(hosting, "crm", "feat/export");
  });

  it("leaves production alone", async () => {
    await deploy(hosting, production, build("v1", []));
    await deploy(hosting, branch, build("p1", []));
    await teardownPreview(hosting, "crm", "feat/export");
    expect([...cloudflare.scripts.keys()]).toEqual([SCRIPT]);
    expect(cloudflare.databases.size).toBe(1);
  });
});
