import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveVersion,
  createRegistry,
  deployBuild,
  migratePlatform,
  promoteVersion,
  rejectVersion,
  rollbackEnvironment,
  VIA_FORGERON_MCP,
  type Registry,
  type Tool,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let tool: Tool;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  tool = await registry.createTool({ workspace: "acme", name: "crm" });
});
afterEach(() => memory.close());

// Only `resources` matters to the approval; the diff reads the rest as absent.
const manifestOf = (resources: object) =>
  ({
    name: "crm",
    roles: {},
    actions: {},
    views: {},
    jobs: {},
    events: {},
    uses: {},
    interfaces: {},
    preview: { data: "seed" },
    resources,
  }) as unknown as Build["manifest"];

const build = (fingerprint: string, resources: object): Build => ({
  manifest: manifestOf(resources),
  worker: `// ${fingerprint}`,
  fingerprint,
  changelog: { entries: [{}], declared: "major", detected: "major" },
});

const hosting = (): Hosting => ({
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
});

const deployTo = (
  environment: "preview" | "pilot" | "production",
  fingerprint: string,
  version: string,
  resources: object,
  branch?: string,
) =>
  deployBuild(registry, hosting(), {
    tool,
    environment,
    ...(branch ? { branch } : {}),
    build: build(fingerprint, resources),
    version,
    actor: "ely",
  });

const network = { network: { allow: ["api.hubspot.com"], why: "Sync deals" } };

describe("approving the resources a version asks for", () => {
  it("lets a version that asks for something new reach a preview, not pilot or production", async () => {
    const preview = await deployTo("preview", "fp1", "1.0.0-a", network, "feat-a");
    expect(preview.environment.versionId).toBe(preview.version.id);

    await expect(deployTo("production", "fp2", "1.0.0", network)).rejects.toMatchObject({
      code: "PENDING_APPROVAL",
    });
    await expect(deployTo("pilot", "fp3", "1.0.1", network)).rejects.toMatchObject({
      code: "PENDING_APPROVAL",
    });
    const production = (await registry.listEnvironments(tool.id)).find(
      (e) => e.name === "production",
    );
    expect(production?.versionId).toBeUndefined();
  });

  it("lists the pending versions with what each asks for, added or broadened", async () => {
    await deployTo("preview", "fp1", "1.0.0", { cache: {} }, "feat-a");
    await approveAndShip("1.0.0");
    await deployTo("preview", "fp2", "1.1.0", { cache: {}, ...network }, "feat-b");

    const pending = await registry.pendingVersions(tool.id);
    expect(pending.map((p) => p.version.version)).toEqual(["1.1.0"]);
    expect(pending[0]!.approvals.map((a) => [a.resource, a.kind])).toEqual([
      ["resources.network", "resource.added"],
    ]);
  });

  it("unblocks pilot and production once an admin approves, and logs the approval", async () => {
    const preview = await deployTo("preview", "fp1", "1.0.0", network, "feat-a");
    const approved = await approveVersion(registry, preview.version.id, "admin-1");
    expect(approved.map((a) => a.status)).toEqual(["approved"]);
    expect(await registry.pendingVersions(tool.id)).toEqual([]);

    const result = await promoteVersion(registry, hosting(), {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "ely",
    });
    expect(result.environment.versionId).toBe(preview.version.id);

    const audit = await registry.listAudit(tool.id, { kind: "approval" });
    expect(audit).toMatchObject([
      {
        actor: "admin-1",
        kind: "approval",
        subject: "resources.network",
        versionId: preview.version.id,
        result: "ok",
        detail: { decision: "approved" },
      },
    ]);
  });

  it("keeps a rejected version out of production", async () => {
    const preview = await deployTo("preview", "fp1", "1.0.0", network, "feat-a");
    await rejectVersion(registry, preview.version.id, "admin-1");
    await expect(
      promoteVersion(registry, hosting(), {
        tool,
        version: "1.0.0",
        to: "production",
        actor: "ely",
      }),
    ).rejects.toMatchObject({ code: "PENDING_APPROVAL" });
  });

  it("asks nothing for a version that removes a resource or changes nothing", async () => {
    const first = await deployTo("preview", "fp1", "1.0.0", { cache: {}, ...network }, "a");
    await approveVersion(registry, first.version.id, "admin-1");
    await promoteVersion(registry, hosting(), {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "ely",
    });
    // Production now has cache and network: a version with only the cache removes one.
    const smaller = await deployTo("production", "fp2", "1.1.0", { cache: {} });
    expect(smaller.environment.versionId).toBe(smaller.version.id);
    expect(await registry.pendingVersions(tool.id)).toEqual([]);
  });

  it("is judged against what production serves, not against nothing", async () => {
    const first = await deployTo("preview", "fp1", "1.0.0", network, "a");
    await approveVersion(registry, first.version.id, "admin-1");
    await promoteVersion(registry, hosting(), {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "ely",
    });
    const same = await deployTo("production", "fp2", "1.0.1", network);
    expect(same.environment.versionId).toBe(same.version.id);
  });

  async function approveAndShip(version: string) {
    const found = (await registry.findVersion(tool.id, version))!;
    await approveVersion(registry, found.id, "admin-1");
    await promoteVersion(registry, hosting(), { tool, version, to: "production", actor: "ely" });
  }
});

describe("the audit log", () => {
  it("records deployments, promotions and rollbacks with who and which version", async () => {
    const v1 = await deployTo("production", "fp1", "1.0.0", {});
    await deployTo("production", "fp2", "1.1.0", {});
    await rollbackEnvironment(registry, hosting(), {
      tool,
      environment: "production",
      actor: "sam",
    });
    await deployTo("preview", "fp3", "1.2.0-a", {}, "a");
    await promoteVersion(registry, hosting(), {
      tool,
      version: "1.2.0-a",
      to: "pilot",
      actor: "kim",
    });

    const log = (await registry.listAudit(tool.id)).reverse();
    expect(log.map((l) => [l.kind, l.actor, l.subject])).toEqual([
      ["deployment", "ely", "production:1.0.0"],
      ["deployment", "ely", "production:1.1.0"],
      ["rollback", "sam", "production:1.0.0"],
      ["deployment", "ely", "preview:1.2.0-a"],
      ["promotion", "kim", "pilot:1.2.0-a"],
    ]);
    expect(log[2]).toMatchObject({ versionId: v1.version.id, result: "ok" });
    expect(log.every((l) => l.at.length > 0)).toBe(true);
    expect(await registry.listAudit(tool.id, { kind: "promotion", limit: 5 })).toHaveLength(1);
  });

  it("records each action call with person, time, interface and result", async () => {
    await registry.recordActionCall({
      toolId: tool.id,
      actor: "ely",
      interface: "api",
      action: "deals.move",
      result: "ok",
    });
    await registry.recordActionCall({
      toolId: tool.id,
      actor: "eve",
      interface: "mcp",
      action: "deals.move",
      result: "denied",
    });
    const [denied, ok] = await registry.listAudit(tool.id, { kind: "action" });
    expect(ok).toMatchObject({
      actor: "ely",
      interface: "api",
      subject: "deals.move",
      result: "ok",
    });
    expect(denied).toMatchObject({ actor: "eve", interface: "mcp", result: "denied" });
    expect(ok!.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("marks what the admin MCP does as via Forgeron MCP", async () => {
    const preview = await deployTo("preview", "fp1", "1.0.0", network, "a");
    await approveVersion(registry, preview.version.id, "admin-1", VIA_FORGERON_MCP);
    const [entry] = await registry.listAudit(tool.id, { kind: "approval" });
    expect(entry?.via).toBe("Forgeron MCP");
    await registry.recordActionCall({
      toolId: tool.id,
      actor: "admin-1",
      interface: "mcp",
      action: "tool_promote",
      result: "ok",
      via: VIA_FORGERON_MCP,
    });
    expect((await registry.listAudit(tool.id, { kind: "action" }))[0]?.via).toBe("Forgeron MCP");
  });

  it("outlives the tool it is about", async () => {
    await deployTo("production", "fp1", "1.0.0", {});
    await registry.deleteTool(tool.id);
    expect(await registry.listAudit(tool.id)).toHaveLength(1);
  });
});
