import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createReseal,
  createRegistry,
  createSecretBox,
  marketplaceSource,
  migratePlatform,
  type Registry,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// 32 bytes of zeros: a test key, never a real one.
const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(TEST_KEY) });
});
afterEach(() => memory.close());

/** What a sync does for one tool of the index: a build, its docs, a version in `@mp:<id>`. */
async function offer(source: string, name: string, version: string, resources: object = {}) {
  const tool =
    (await registry.findTool(source, name)) ??
    (await registry.createTool({ workspace: source, name }));
  const build = await registry.recordBuild(tool.id, {
    fingerprint: `${name}-${version}`,
    manifest: { name, roles: {}, actions: {}, resources },
    worker: `// ${name} ${version}`,
    changelog: { entries: [], declared: "none", detected: "none" },
  });
  await registry.storeDocs(tool.id, build.id, { readme: `# ${name}`, guide: "# Hi", assets: [] });
  await registry.publishVersion(tool.id, build.id, version);
}

describe("the marketplaces of a workspace", () => {
  it("adds a private repository with its token sealed, lists it without the token", async () => {
    const added = await registry.addMarketplace({
      workspace: "acme",
      repo: "edicia-sh/tools",
      token: "test-token",
      actor: "p-admin",
    });
    expect(added).toMatchObject({ repo: "edicia-sh/tools", hasToken: true, createdBy: "p-admin" });
    expect(JSON.stringify(await registry.listMarketplaces("acme"))).not.toContain("test-token");
    const row = (await d1.prepare(`SELECT "ciphertext" FROM "marketplaces"`).all()).results?.[0];
    expect(JSON.stringify(row)).not.toContain("test-token");
    expect(await registry.marketplaceToken("acme", added.id)).toBe("test-token");
    // Another workspace sees nothing of it.
    expect(await registry.listMarketplaces("other")).toEqual([]);
    expect(await registry.findMarketplace("other", added.id)).toBeUndefined();
  });

  it("adds a public repository without a token", async () => {
    const added = await registry.addMarketplace({
      workspace: "acme",
      repo: "forgeron-sh/templates",
      actor: "p",
    });
    expect(added.hasToken).toBe(false);
    expect(await registry.marketplaceToken("acme", added.id)).toBeUndefined();
  });

  it("refuses a name that is not owner/name, and the same repository twice", async () => {
    for (const repo of ["tools", "a/b/c", "https://github.com/a/b", "-a/b", "a/b c"]) {
      await expect(
        registry.addMarketplace({ workspace: "acme", repo, actor: "p" }),
      ).rejects.toMatchObject({ code: "INVALID" });
    }
    await registry.addMarketplace({ workspace: "acme", repo: "edicia-sh/tools", actor: "p" });
    await expect(
      registry.addMarketplace({ workspace: "acme", repo: "Edicia-sh/Tools", actor: "p" }),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
  });

  it("records the last sync: the title, or why it failed", async () => {
    const { id } = await registry.addMarketplace({ workspace: "acme", repo: "e/t", actor: "p" });
    await registry.recordMarketplaceSync("acme", id, { error: "The index is not valid." });
    expect(await registry.findMarketplace("acme", id)).toMatchObject({
      syncError: "The index is not valid.",
    });
    await registry.recordMarketplaceSync("acme", id, { title: "Outils Edicia" });
    const found = (await registry.findMarketplace("acme", id))!;
    expect(found.title).toBe("Outils Edicia");
    expect(found.syncedAt).toBeDefined();
    expect(found.syncError).toBeUndefined();
  });

  it("removes a marketplace and what it offered, not what was installed from it", async () => {
    const { id } = await registry.addMarketplace({ workspace: "acme", repo: "e/t", actor: "p" });
    await offer(marketplaceSource(id), "odoo", "1.0.0");
    await registry.installTemplate({
      workspace: "acme",
      template: "odoo",
      actor: "p",
      source: marketplaceSource(id),
    });
    await registry.removeMarketplace({ workspace: "acme", id, actor: "p" });
    expect(await registry.listMarketplaces("acme")).toEqual([]);
    expect(await registry.listTools(marketplaceSource(id))).toEqual([]);
    expect(await registry.findTool("acme", "odoo")).toBeDefined();
    await expect(
      registry.removeMarketplace({ workspace: "acme", id, actor: "p" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("seals the token again under a new key", async () => {
    const { id } = await registry.addMarketplace({
      workspace: "acme",
      repo: "e/t",
      token: "test-token",
      actor: "p",
    });
    const next = btoa(String.fromCharCode(...new Uint8Array(32).fill(1)));
    const box = await createSecretBox(next, [TEST_KEY]);
    const report = await createReseal(d1, box).resealSecrets("acme");
    expect(report.resealed).toBe(1);
    const resealed = createRegistry(d1, { secrets: await createSecretBox(next) });
    expect(await resealed.marketplaceToken("acme", id)).toBe("test-token");
  });
});

describe("installing from a marketplace", () => {
  it("lists what it offers and installs a tool with its guide, through a plan too", async () => {
    const { id } = await registry.addMarketplace({ workspace: "acme", repo: "e/t", actor: "p" });
    const source = marketplaceSource(id);
    await offer(source, "odoo", "1.0.0", { network: { allow: ["*.odoo.com"], why: "Odoo" } });
    expect(await registry.listTemplates(source)).toEqual([
      { name: "odoo", version: "1.0.0", resources: ["resources.network"] },
    ]);
    // The official catalogue does not show it.
    expect(await registry.listTemplates()).toEqual([]);

    const plan = await registry.createInstallPlan({
      workspace: "acme",
      template: "odoo",
      person: "p",
      source,
    });
    const installed = await registry.installFromPlan({
      workspace: "acme",
      plan: plan.id,
      person: "p",
    });
    expect(installed).toMatchObject({ tool: { name: "odoo" }, version: { version: "1.0.0" } });
    const tool = (await registry.findTool("acme", "odoo"))!;
    const [version] = await registry.listVersions(tool.id);
    const build = (await registry.getBuild(version!.buildId))!;
    expect(await registry.guideOf(tool.id, build.id)).toBe("# Hi");
    const [line] = await registry.listAudit(tool.id);
    expect(line!.detail).toMatchObject({ template: "odoo", source });
  });

  it("refuses a source that is not a catalogue", async () => {
    await expect(registry.listTemplates("acme")).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.installTemplate({ workspace: "acme", template: "x", actor: "p", source: "acme" }),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.installTemplate({
        workspace: marketplaceSource("m"),
        template: "x",
        actor: "p",
      }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });
});
