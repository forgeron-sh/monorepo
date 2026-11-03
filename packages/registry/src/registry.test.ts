import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database } from "@forgeron/hosting";
import {
  createRegistry,
  migratePlatform,
  platformMigrations,
  RegistryError,
  type Registry,
} from "./index";

// A Miniflare per test is slow when the machine is busy.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let mf: Miniflare;
let d1: D1Database;
let registry: Registry;
let tick = 0;

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => new Date(Date.UTC(2026, 10, 3, 12, 0, tick++)) });
});
afterEach(() => mf.dispose());

const code = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: RegistryError) => error.code,
  );

async function seed() {
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "fp1",
    manifest: { name: "crm" },
    changelog: { entries: [], declared: "none", detected: "none" },
  });
  const version = await registry.publishVersion(tool.id, build.id, "1.0.0");
  return { tool, build, version };
}

describe("migrations", () => {
  it("are recorded and run once", async () => {
    expect(await migratePlatform(d1)).toEqual({ applied: [] });
    const { results } = await d1.prepare(`SELECT "name" FROM "_forgeron_migrations"`).all();
    expect(results).toEqual(platformMigrations.map((m) => ({ name: m.name })));
  });
});

describe("tools", () => {
  it("creates, finds and lists by workspace", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.createTool({ workspace: "acme", name: "assets" });
    await registry.createTool({ workspace: "other", name: "crm" });
    expect(await registry.findTool("acme", "crm")).toEqual(tool);
    expect((await registry.listTools("acme")).map((t) => t.name)).toEqual(["assets", "crm"]);
  });

  it("refuses a second tool of the same name in a workspace", async () => {
    await registry.createTool({ workspace: "acme", name: "crm" });
    expect(await code(registry.createTool({ workspace: "acme", name: "crm" }))).toBe(
      "ALREADY_EXISTS",
    );
  });

  it("deleting a tool deletes everything under it", async () => {
    const { tool, version } = await seed();
    const env = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(env.id, version.id, { actor: "ely" });
    await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    await registry.deleteTool(tool.id);
    for (const table of ["builds", "versions", "environments", "approvals"]) {
      const { results } = await d1.prepare(`SELECT count(*) AS n FROM "${table}"`).all();
      expect(results).toEqual([{ n: 0 }]);
    }
  });
});

describe("builds and versions", () => {
  it("records a build once per fingerprint and round-trips its JSON", async () => {
    const { tool, build } = await seed();
    const again = await registry.recordBuild(tool.id, {
      fingerprint: "fp1",
      manifest: { other: 1 },
    });
    expect(again.id).toBe(build.id);
    expect(again.manifest).toEqual({ name: "crm" });
    const bare = await registry.recordBuild(tool.id, { fingerprint: "fp2", manifest: {} });
    expect(bare.changelog).toBeNull();
  });

  it("publishes a version number once, for a build of the same tool", async () => {
    const { tool, build } = await seed();
    expect(await code(registry.publishVersion(tool.id, build.id, "1.0.0"))).toBe("ALREADY_EXISTS");
    const other = await registry.createTool({ workspace: "acme", name: "assets" });
    expect(await code(registry.publishVersion(other.id, build.id, "1.0.0"))).toBe("WRONG_TOOL");
    expect(await code(registry.publishVersion(tool.id, "missing", "2.0.0"))).toBe("NOT_FOUND");
  });

  it("lists versions in publication order", async () => {
    const { tool, build } = await seed();
    await registry.publishVersion(tool.id, build.id, "0.9.0");
    expect((await registry.listVersions(tool.id)).map((v) => v.version)).toEqual([
      "1.0.0",
      "0.9.0",
    ]);
  });
});

describe("environments", () => {
  it("has one production per tool and one preview per branch", async () => {
    const { tool } = await seed();
    const production = await registry.ensureEnvironment(tool.id, "production");
    expect((await registry.ensureEnvironment(tool.id, "production")).id).toBe(production.id);
    const a = await registry.ensureEnvironment(tool.id, "preview", "feat/a");
    const b = await registry.ensureEnvironment(tool.id, "preview", "feat/b");
    expect(a.id).not.toBe(b.id);
    expect(a.branch).toBe("feat/a");
    expect(production.branch).toBeUndefined();
    expect(await code(registry.ensureEnvironment(tool.id, "preview"))).toBe("BRANCH_REQUIRED");
    expect(await registry.listEnvironments(tool.id)).toHaveLength(3);
  });

  it("records which version an environment serves, and keeps the last one", async () => {
    const { tool, build, version } = await seed();
    const second = await registry.publishVersion(tool.id, build.id, "1.1.0");
    const env = await registry.ensureEnvironment(tool.id, "pilot");
    expect(env.versionId).toBeUndefined();
    await registry.activate(env.id, version.id, { actor: "ely", url: "https://pilot.example" });
    const switched = await registry.activate(env.id, second.id, { actor: "ely" });
    expect(switched.versionId).toBe(second.id);
    expect(switched.url).toBeUndefined();
    expect(switched.activatedAt).toBeDefined();
  });

  it("refuses a version of another tool, and a deleted version leaves the environment idle", async () => {
    const { tool, version } = await seed();
    const other = await registry.createTool({ workspace: "acme", name: "assets" });
    const otherEnv = await registry.ensureEnvironment(other.id, "production");
    expect(await code(registry.activate(otherEnv.id, version.id, { actor: "ely" }))).toBe(
      "WRONG_TOOL",
    );
    expect(await code(registry.activate("missing", version.id, { actor: "ely" }))).toBe(
      "NOT_FOUND",
    );
    const env = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(env.id, version.id, { actor: "ely" });
    await d1.batch([d1.prepare(`DELETE FROM "versions" WHERE "id" = ?`).bind(version.id)]);
    expect((await registry.listEnvironments(tool.id))[0]?.versionId).toBeUndefined();
  });

  it("removes a preview", async () => {
    const { tool } = await seed();
    const env = await registry.ensureEnvironment(tool.id, "preview", "feat/a");
    await registry.removeEnvironment(env.id);
    expect(await registry.listEnvironments(tool.id)).toEqual([]);
  });
});

describe("approvals", () => {
  it("is requested once per version and resource", async () => {
    const { version } = await seed();
    const first = await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    const again = await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    expect(again.id).toBe(first.id);
    expect(first.status).toBe("pending");
    expect(await code(registry.requestApproval("missing", { resource: "DB", kind: "d1" }))).toBe(
      "NOT_FOUND",
    );
  });

  it("is decided once, by someone, and unblocks the version", async () => {
    const { tool, version } = await seed();
    const db = await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    const files = await registry.requestApproval(version.id, { resource: "FILES", kind: "r2" });
    expect(await registry.unapproved(version.id)).toHaveLength(2);

    const approved = await registry.decideApproval(db.id, "approved", "ely");
    expect(approved).toMatchObject({ status: "approved", decidedBy: "ely" });
    expect(approved.decidedAt).toBeDefined();
    expect(await code(registry.decideApproval(db.id, "rejected", "eve"))).toBe("ALREADY_DECIDED");
    expect(await code(registry.decideApproval("missing", "approved", "ely"))).toBe("NOT_FOUND");

    expect((await registry.unapproved(version.id)).map((a) => a.id)).toEqual([files.id]);
    await registry.decideApproval(files.id, "rejected", "ely");
    expect(await registry.unapproved(version.id)).toHaveLength(1);
    expect((await registry.listApprovals(tool.id, "approved")).map((a) => a.id)).toEqual([db.id]);
    expect(await registry.listApprovals(tool.id)).toHaveLength(2);
  });
});
