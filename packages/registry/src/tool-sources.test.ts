import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, marketplaceSource, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
});
afterEach(() => memory.close());

const SOURCE = marketplaceSource("m1");

/** What a sync does for one tool of the index: a build, its docs, a version in the catalogue. */
async function offer(name: string, version: string, resources: object = {}) {
  const tool =
    (await registry.findTool(SOURCE, name)) ??
    (await registry.createTool({ workspace: SOURCE, name }));
  const build = await registry.recordBuild(tool.id, {
    fingerprint: `${name}-${version}`,
    manifest: { name, roles: {}, actions: {}, resources },
    worker: `// ${name} ${version}`,
    changelog: { entries: [], declared: "none", detected: "none" },
  });
  await registry.storeDocs(tool.id, build.id, { readme: `# ${name}`, assets: [] });
  await registry.publishVersion(tool.id, build.id, version);
}

/** Production serves a version, as a promotion would leave it. */
async function serve(toolId: string, version: string, name = "production", branch?: string) {
  const found = (await registry.findVersion(toolId, version))!;
  const env = await registry.ensureEnvironment(toolId, name as "production" | "preview", branch);
  await registry.activate(env.id, found.id, { actor: "test" });
}

describe("where a tool comes from (D-121)", () => {
  it("records the marketplace at install, and offers its newer version as an update", async () => {
    await offer("odoo", "1.0.0", { network: { allow: ["*.odoo.com"], why: "Odoo" } });
    const installed = await registry.installTemplate({
      workspace: "acme",
      template: "odoo",
      source: SOURCE,
      actor: "p-admin",
    });
    expect(await registry.toolSource(installed.tool.id)).toEqual({
      kind: "marketplace",
      source: SOURCE,
      sourceTool: "odoo",
      productionBranch: "main",
      autoUpdate: false,
      recorded: true,
    });
    // Installed, not in production yet: the installed version is the update.
    expect(await registry.availableUpdate(installed.tool.id)).toEqual({ version: "1.0.0" });
    await serve(installed.tool.id, "1.0.0");
    expect(await registry.availableUpdate(installed.tool.id)).toBeUndefined();

    await offer("odoo", "1.1.0", {
      network: { allow: ["*.odoo.com", "api.example.com"], why: "Odoo" },
    });
    expect(await registry.availableUpdate(installed.tool.id)).toEqual({ version: "1.1.0" });
  });

  it("copies the new version with only what production does not have to approve", async () => {
    await offer("odoo", "1.0.0", { network: { allow: ["*.odoo.com"], why: "Odoo" } });
    const { tool } = await registry.installTemplate({
      workspace: "acme",
      template: "odoo",
      source: SOURCE,
      actor: "p-admin",
    });
    await serve(tool.id, "1.0.0");
    await offer("odoo", "1.1.0", {
      network: { allow: ["*.odoo.com"], why: "Odoo" },
      secrets: { ODOO_KEY: { why: "API key" } },
    });
    const updated = await registry.updateFromSource({ toolId: tool.id, actor: "p-admin" });
    expect(updated.version).toBe("1.1.0");
    expect(updated.approvals.map((a) => a.resource)).toEqual(["resources.secrets.ODOO_KEY"]);
    const version = (await registry.findVersion(tool.id, "1.1.0"))!;
    expect((await registry.unapproved(version.id)).map((a) => a.resource)).toEqual([
      "resources.secrets.ODOO_KEY",
    ]);
    expect(await registry.readmeOf(tool.id, version.buildId)).toBe("# odoo");
    // Asked again, nothing is copied twice.
    expect(await registry.updateFromSource({ toolId: tool.id, actor: "p-admin" })).toEqual({
      version: "1.1.0",
      approvals: [],
    });
    expect((await registry.listVersions(tool.id)).map((v) => v.version)).toEqual([
      "1.0.0",
      "1.1.0",
    ]);
  });

  it("refuses an update for a tool that does not come from a marketplace", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await expect(registry.updateFromSource({ toolId: tool.id, actor: "p" })).rejects.toThrow(
      /not installed from a marketplace/,
    );
  });

  it("reads a repository tool's update from its production branch, and keeps its settings", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    expect(await registry.toolSource(tool.id)).toMatchObject({
      kind: "repo",
      productionBranch: "main",
      recorded: false,
    });
    const linked = await registry.linkRepository({
      toolId: tool.id,
      repo: "acme/crm",
      productionBranch: "trunk",
      actor: "p-admin",
    });
    expect(linked).toMatchObject({ kind: "repo", repo: "acme/crm", productionBranch: "trunk" });
    expect(await registry.availableUpdate(tool.id)).toBeUndefined();

    const release = { entries: [{}], declared: "minor", detected: "none", released: true };
    for (const [v, branch, changelog] of [
      ["1.0.0", undefined, release],
      ["1.1.0-preview.trunk+abc", "trunk", release],
      ["1.2.0-preview.feat+def", "feat", release],
      ["1.1.1-preview.trunk+wip", "trunk", undefined],
    ] as const) {
      const build = await registry.recordBuild(tool.id, {
        fingerprint: v,
        manifest: { name: "crm", roles: {}, actions: {}, resources: {} },
        worker: "//",
        ...(changelog ? { changelog } : {}),
      });
      await registry.publishVersion(tool.id, build.id, v, branch);
    }
    await serve(tool.id, "1.0.0");
    await serve(tool.id, "1.2.0-preview.feat+def", "preview", "feat");
    await serve(tool.id, "1.1.1-preview.trunk+wip", "preview", "trunk");
    // Another branch's release is not production's; trunk's preview serves a build that is not a
    // release: production is offered trunk's latest release (D-125).
    expect(await registry.availableUpdate(tool.id)).toEqual({
      version: "1.1.0-preview.trunk+abc",
      branch: "trunk",
    });

    const set = await registry.setToolSource({ toolId: tool.id, autoUpdate: true, actor: "p" });
    expect(set).toMatchObject({ kind: "repo", repo: "acme/crm", autoUpdate: true });
    await serve(tool.id, "1.1.0-preview.trunk+abc");
    expect(await registry.availableUpdate(tool.id)).toBeUndefined();
  });

  it("finds a repository's tool by GitHub's number first, then by its name without case (D-123)", async () => {
    const crm = await registry.createTool({ workspace: "acme", name: "crm" });
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.linkRepository({
      toolId: crm.id,
      repo: "Acme-sh/CRM",
      repoId: 101,
      productionBranch: "main",
      actor: "p",
    });
    // Linked by hand, before the app: no number.
    await registry.linkRepository({
      toolId: odoo.id,
      repo: "acme-sh/odoo",
      productionBranch: "main",
      actor: "p",
    });
    expect(await registry.toolSource(crm.id)).toMatchObject({ repo: "Acme-sh/CRM", repoId: 101 });

    const find = (repo: string, repoId?: number) =>
      registry
        .toolByRepository("acme", { repo, ...(repoId === undefined ? {} : { repoId }) })
        .then((t) => t?.name);
    expect(await find("acme-sh/crm", 101)).toBe("crm");
    expect(await find("ACME-SH/crm")).toBe("crm");
    // Renamed on GitHub: the number still finds it.
    expect(await find("acme-sh/crm-renamed", 101)).toBe("crm");
    // Deleted and made again under the same name: another repository.
    expect(await find("acme-sh/crm", 202)).toBeUndefined();
    // A link with no number takes the name.
    expect(await find("acme-sh/odoo", 303)).toBe("odoo");
    expect(await find("acme-sh/nothing")).toBeUndefined();
    // Another workspace's tools are not found.
    expect(
      await registry.toolByRepository("other", { repo: "acme-sh/crm", repoId: 101 }),
    ).toBeUndefined();
    // A marketplace tool is no repository's.
    await offer("mp", "1.0.0");
    expect(await registry.toolByRepository(SOURCE, { repo: "acme-sh/mp" })).toBeUndefined();
  });
});
