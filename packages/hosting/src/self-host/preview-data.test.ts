import type { Manifest } from "@forgeron/manifest";
import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSelfHostHosting,
  deploy,
  PreviewDataError,
  type Build,
  type D1Database,
  type Environment,
} from "../index";
import { FakeCloudflare } from "./fake-cloudflare";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const st = (sql: string) => ({ sql, parameters: [] });
const manifest = (data?: "seed" | "empty" | "snapshot") =>
  ({
    resources: { db: { engine: "d1" } },
    ...(data ? { preview: { data } } : {}),
  }) as unknown as Manifest;
const build = (data?: "seed" | "empty" | "snapshot"): Build => ({
  manifest: manifest(data),
  worker: "export default {}",
  fingerprint: "fp",
  migrations: [
    {
      name: "0001",
      fingerprint: "fp-0001",
      up: [st("CREATE TABLE a (id INTEGER)")],
      down: [],
      destructive: false,
    },
  ],
});
const preview = (branch: string): Environment => ({ tool: "crm", name: "preview", branch });

// One D1 per database the fake account creates: a branch never sees another's data.
let mf: Miniflare;
let cloud: FakeCloudflare;
let hosting: ReturnType<typeof createSelfHostHosting>;
const databases = new Map<string, D1Database>();

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: { A: "a", B: "b", PROD: "prod" },
  });
  databases.clear();
  const spare = ["A", "B", "PROD"];
  const backing = new Map<string, D1Database>();
  for (const binding of spare) {
    backing.set(binding, (await mf.getD1Database(binding)) as unknown as D1Database);
  }
  let next = 0;
  cloud = new FakeCloudflare((name) => {
    const d1 = backing.get(spare[next++]!)!;
    databases.set(name, d1);
    return d1;
  });
  hosting = createSelfHostHosting({
    accountId: "acct",
    apiToken: "test-token",
    workspace: "acme",
    fetch: cloud.fetch,
    url: (name) => `https://${name}.example.test`,
  });
});
afterEach(() => mf.dispose());

const fill = async (db: D1Database) =>
  void (await db.batch([db.prepare("INSERT INTO a (id) VALUES (1)")]));
const count = async (db: D1Database) =>
  ((await db.prepare("SELECT COUNT(*) AS n FROM a").all()).results as { n: number }[])[0]!.n;

describe("a preview's database", () => {
  it("is created for the branch, migrated, then seeded by default", async () => {
    const result = await deploy(hosting, preview("feat/a"), build(), { seed: fill });
    expect(result.applied).toEqual(["0001"]);
    expect(result.database).toEqual({ fresh: true, data: "seed", seeded: true });
    const [name] = [...databases.keys()];
    expect(name).toContain("preview-feat-a");
    expect(await count(databases.get(name!)!)).toBe(1);
  });

  it("gives each branch its own database", async () => {
    await deploy(hosting, preview("feat/a"), build(), { seed: fill });
    await deploy(hosting, preview("feat/b"), build(), { seed: fill });
    expect(databases.size).toBe(2);
    for (const db of databases.values()) expect(await count(db)).toBe(1);
  });

  it("is seeded once: deploying the branch again keeps its data and does not seed again", async () => {
    const seed = vi.fn<typeof fill>(fill);
    await deploy(hosting, preview("feat/a"), build(), { seed });
    const again = await deploy(hosting, preview("feat/a"), build(), { seed });
    expect(seed).toHaveBeenCalledTimes(1);
    expect(again.database).toEqual({ fresh: false, seeded: false });
    expect(databases.size).toBe(1);
    expect(await count([...databases.values()][0]!)).toBe(1);
  });

  it("stays empty with preview.data: empty", async () => {
    const seed = vi.fn<typeof fill>();
    const result = await deploy(hosting, preview("feat/a"), build("empty"), { seed });
    expect(seed).not.toHaveBeenCalled();
    expect(result.database).toEqual({ fresh: true, data: "empty", seeded: false });
    expect(await count([...databases.values()][0]!)).toBe(0);
  });

  it("says it is not seeded when nobody can run the tool's seed", async () => {
    const result = await deploy(hosting, preview("feat/a"), build());
    expect(result.database).toEqual({ fresh: true, data: "seed", seeded: false });
  });

  it("refuses preview.data: snapshot, which is not implemented", async () => {
    await expect(deploy(hosting, preview("feat/a"), build("snapshot"))).rejects.toThrow(
      PreviewDataError,
    );
  });

  it("is removed when the seed fails, so that the next deployment starts clean", async () => {
    const failing = async () => {
      throw new Error("boom");
    };
    await expect(deploy(hosting, preview("feat/a"), build(), { seed: failing })).rejects.toThrow(
      /seed failed.*boom/,
    );
    expect(cloud.databases.size).toBe(0);
    const retry = await deploy(hosting, preview("feat/a"), build(), {
      seed: fill,
    });
    expect(retry.database).toMatchObject({ fresh: true, seeded: true });
  });

  it("does not touch production: no seed there, whatever preview.data says", async () => {
    const seed = vi.fn<typeof fill>();
    const result = await deploy(
      hosting,
      { tool: "crm", name: "production" },
      {
        ...build(),
        changelog: { entries: [{}], declared: "patch", detected: "patch" },
      },
      { seed },
    );
    expect(seed).not.toHaveBeenCalled();
    expect(result.database).toBeUndefined();
  });
});
