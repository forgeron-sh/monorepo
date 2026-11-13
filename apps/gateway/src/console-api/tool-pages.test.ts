import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { platformCaller } from "../platform/test-app";
import { ADMIN, holding } from "../platform/route-matrix";
import type { PlatformPermission } from "@forgeron/permissions";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let caller: { permissions: PlatformPermission[] } | undefined = ADMIN;

const call = (path: string, method = "GET") =>
  platformCaller({ registry, who: () => caller })(
    new Request(`https://acme.forgeron.test${path}`, { method }),
  );

const manifest = (actions: string[]) => ({
  name: "crm",
  version: "1.0.0",
  description: "Companies and contacts.",
  interfaces: { mcp: true, api: true, cli: true, web: false },
  profiles: {},
  views: {},
  jobs: {},
  events: {},
  resources: {},
  uses: {},
  preview: { data: "seed" },
  actions: Object.fromEntries(
    actions.map((name) => [
      name,
      {
        description: name,
        access: "read",
        input: { type: "object", properties: {} },
        confirm: false,
        cli: { args: [] },
        http: { method: "GET" },
        interfaces: ["api"],
      },
    ]),
  ),
});

async function publish(
  toolId: string,
  version: string,
  options: {
    actions?: string[];
    entries?: Array<{ type: string; bump: string; description: string }>;
    migrations?: string[];
  },
) {
  const build = await registry.recordBuild(toolId, {
    fingerprint: `fp-${version}`,
    manifest: manifest(options.actions ?? ["contacts.list"]),
    ...(options.entries
      ? { changelog: { entries: options.entries, declared: "minor", detected: "minor" } }
      : {}),
    ...(options.migrations
      ? { migrations: options.migrations.map((name) => ({ name, up: [] })) }
      : {}),
  });
  return registry.publishVersion(toolId, build.id, version);
}

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const v1 = await publish(tool.id, "1.0.0", { migrations: ["0001_init"] });
  const v2 = await publish(tool.id, "1.1.0", {
    actions: ["contacts.list", "contacts.export"],
    entries: [{ type: "added", bump: "minor", description: "Export contacts." }],
    migrations: ["0001_init", "0002_export"],
  });
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, v1.id, {
    actor: "ci",
    url: "https://acme.test/t/crm",
    commit: { sha: "aaaaaaa1", message: "Initial", author: "Ada" },
  });
  await registry.activate(production.id, v2.id, {
    actor: "ci",
    url: "https://acme.test/t/crm",
    commit: { sha: "bbbbbbb2", message: "Add the export", author: "Bob" },
  });
  const preview = await registry.ensureEnvironment(tool.id, "preview", "feat-export");
  await registry.activate(preview.id, v2.id, {
    actor: "deploy:ci-token",
    url: "https://feat-export.test",
  });
  await registry.createTool({ workspace: "acme", name: "draft" });
});
afterAll(() => memory.close());

describe("a tool's branches", () => {
  it("answers production and one row per preview, with commit, history and rollback target", async () => {
    const response = (await call("/api/tools/crm/branches"))!;
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.production).toMatchObject({
      environment: "production",
      version: "1.1.0",
      status: "ready",
      commit: { sha: "bbbbbbb2", message: "Add the export", author: "Bob" },
      deployedBy: "ci",
      url: "https://acme.forgeron.test/t/crm",
      rollbackTo: "1.0.0",
      migrations: { count: 2, last: "0002_export" },
    });
    expect(body.production.deployments.map((d: any) => d.version)).toEqual(["1.1.0", "1.0.0"]);
    expect(body.branches).toHaveLength(1);
    expect(body.branches[0]).toMatchObject({
      environment: "preview",
      branch: "feat-export",
      version: "1.1.0",
      // The address is where the gateway serves the preview, not what the deployment stored.
      url: "https://acme.forgeron.test/t/crm@feat-export",
      // The preview was deployed without a commit: the version's own commit stands in.
      commit: { sha: "bbbbbbb2" },
    });
    expect(body.branches[0].rollbackTo).toBeUndefined();
    expect(body.branches[0].deployedBy).toBe("ci-token (deploy token)");
  });

  it("answers an empty tool", async () => {
    const body = (await (await call("/api/tools/draft/branches"))!.json()) as any;
    expect(body).toEqual({ tool: "draft", production: null, channels: [], branches: [] });
  });
});

describe("a tool's versions", () => {
  it("lists them newest first, each compared with the one before", async () => {
    const body = (await (await call("/api/tools/crm/versions"))!.json()) as any;
    expect(body.versions.map((v: any) => v.version)).toEqual(["1.1.0", "1.0.0"]);
    const [latest, first] = body.versions;
    expect(latest).toMatchObject({
      previous: "1.0.0",
      impact: "minor",
      changelog: { entries: [{ description: "Export contacts." }], declared: "minor" },
    });
    expect(latest.changes).toEqual([
      { kind: "action.added", subject: "actions.contacts.export", impact: "minor" },
    ]);
    expect(latest.environments).toEqual([
      { environment: "preview", branch: "feat-export" },
      { environment: "production" },
    ]);
    expect(first).toMatchObject({ previous: null, changes: [], impact: "none", changelog: null });
  });
});

describe("a tool's activity", () => {
  it("answers its audit lines, newest first, cut to the limit", async () => {
    const body = (await (await call("/api/tools/crm/activity?limit=2"))!.json()) as any;
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0]).toMatchObject({ kind: "deployment", subject: "preview:1.1.0" });
    expect(body.entries[0]).not.toHaveProperty("detail");
  });
});

describe("access", () => {
  it("lets who holds `tools:read` read, refuses a plain member and an anonymous caller", async () => {
    caller = holding("tools:read");
    expect((await call("/api/tools/crm/branches"))!.status).toBe(200);
    caller = holding();
    expect((await call("/api/tools/crm/branches"))!.status).toBe(403);
    expect((await call("/api/tools/crm/activity"))!.status).toBe(403);
    caller = undefined;
    expect((await call("/api/tools/crm/versions"))!.status).toBe(401);
    caller = ADMIN;
  });

  it("answers 404 for an unknown tool, 405 for a write, and ignores other routes", async () => {
    expect((await call("/api/tools/nope/branches"))!.status).toBe(404);
    expect((await call("/api/tools/crm/branches", "POST"))!.status).toBe(405);
    expect(await call("/api/tools/crm")).toBeUndefined();
    expect(await call("/api/tools/crm/secrets")).toBeUndefined();
  });
});
