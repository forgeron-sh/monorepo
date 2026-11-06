import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  migratePlatform,
  RegistryError,
  TEMPLATE_WORKSPACE,
  VIA_FORGERON_MCP,
  type Registry,
} from "./index";

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

const manifest = (name: string, resources: object) => ({
  name,
  roles: {},
  actions: {},
  resources,
});

/** A template is published as a tool is: a build, its docs, a version. */
async function publish(name: string, version: string, resources: object, readme = `# ${name}`) {
  const tool =
    (await registry.findTool(TEMPLATE_WORKSPACE, name)) ??
    (await registry.createTool({ workspace: TEMPLATE_WORKSPACE, name }));
  const build = await registry.recordBuild(tool.id, {
    fingerprint: `${name}-${version}`,
    manifest: manifest(name, resources),
    worker: `// ${name} ${version}`,
    migrations: [{ name: "0001", up: [] }],
    changelog: { entries: [], declared: "none", detected: "none" },
  });
  await registry.storeDocs(tool.id, build.id, { readme, assets: [] });
  await registry.publishVersion(tool.id, build.id, version);
  return tool;
}

describe("the template catalogue", () => {
  it("lists the latest version of each template with what it asks for, and no workspace tool", async () => {
    await publish("crm", "1.0.0", { db: { why: "deals" } });
    await publish("crm", "1.1.0", { db: { why: "deals" }, files: { why: "contracts" } });
    await publish("inventory", "0.3.0", {});
    await registry.createTool({ workspace: "acme", name: "mine" });
    // A tool of the catalogue without a version is not a template yet.
    await registry.createTool({ workspace: TEMPLATE_WORKSPACE, name: "draft" });
    expect(await registry.listTemplates()).toEqual([
      { name: "crm", version: "1.1.0", resources: ["resources.db", "resources.files"] },
      { name: "inventory", version: "0.3.0", resources: [] },
    ]);
    expect((await registry.listTools("acme")).map((t) => t.name)).toEqual(["mine"]);
  });
});

describe("installing a template", () => {
  it("creates the tool with a copy of the latest version, its docs and a pending approval per resource", async () => {
    await publish("crm", "1.0.0", {});
    const source = await publish("crm", "1.1.0", { db: { why: "deals" } }, "# CRM 1.1");
    const installed = await registry.installTemplate({
      workspace: "acme",
      template: "crm",
      actor: "p-admin",
    });
    expect(installed.version.version).toBe("1.1.0");
    expect(installed.approvals).toEqual([{ resource: "resources.db", kind: "resource.added" }]);

    const tool = (await registry.findTool("acme", "crm"))!;
    expect(tool.id).toBe(installed.tool.id);
    const [version] = await registry.listVersions(tool.id);
    expect(version!.version).toBe("1.1.0");
    const build = (await registry.getBuild(version!.buildId))!;
    const sourceBuild = (await registry.getBuild(
      (await registry.listVersions(source.id)).at(-1)!.buildId,
    ))!;
    expect(build.id).not.toBe(sourceBuild.id);
    expect(build.toolId).toBe(tool.id);
    expect({ ...build, id: "", toolId: "", createdAt: "" }).toEqual({
      ...sourceBuild,
      id: "",
      toolId: "",
      createdAt: "",
    });
    expect(await registry.readmeOf(tool.id, build.id)).toBe("# CRM 1.1");

    const waiting = await registry.pendingVersions(tool.id);
    expect(waiting.map((w) => [w.version.version, w.approvals.map((a) => a.resource)])).toEqual([
      ["1.1.0", ["resources.db"]],
    ]);
    // Nothing runs: no environment, and the template itself is untouched.
    expect(await registry.listEnvironments(tool.id)).toEqual([]);
    expect(await registry.listVersions(source.id)).toHaveLength(2);
  });

  it("writes the audit line with the actor, the door and the version", async () => {
    await publish("crm", "1.0.0", {});
    const { tool } = await registry.installTemplate({
      workspace: "acme",
      template: "crm",
      actor: "p-admin",
      via: VIA_FORGERON_MCP,
    });
    const [line] = await registry.listAudit(tool.id);
    expect(line).toMatchObject({
      kind: "install",
      actor: "p-admin",
      via: VIA_FORGERON_MCP,
      subject: "crm:1.0.0",
      result: "ok",
      detail: { template: "crm", workspace: "acme" },
    });
    expect(line!.versionId).toBeDefined();
  });

  it("refuses an unknown template, a name already taken and the catalogue itself", async () => {
    await publish("crm", "1.0.0", {});
    const install = (workspace: string, template: string) =>
      registry.installTemplate({ workspace, template, actor: "p" });
    await expect(install("acme", "nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await registry.createTool({ workspace: "acme", name: "crm" });
    await expect(install("acme", "crm")).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    await expect(install(TEMPLATE_WORKSPACE, "crm")).rejects.toBeInstanceOf(RegistryError);
    // Another workspace is free to install it.
    await expect(install("other", "crm")).resolves.toMatchObject({ tool: { name: "crm" } });
  });

  it("is one batch with the audit line: when the line fails nothing is written", async () => {
    await publish("crm", "1.0.0", { db: { why: "deals" } });
    await memory.exec(
      `CREATE TRIGGER "fail_audit" BEFORE INSERT ON "audit_log" BEGIN SELECT RAISE(ABORT, 'audit refused'); END`,
    );
    await expect(
      registry.installTemplate({ workspace: "acme", template: "crm", actor: "p" }),
    ).rejects.toThrow(/audit refused/);
    expect(await registry.listTools("acme")).toEqual([]);
    const count = async (table: string) =>
      Number(
        (
          await (memory as unknown as D1Database)
            .prepare(`SELECT COUNT(*) AS n FROM "${table}"`)
            .all()
        ).results![0]!.n,
      );
    // Only the template's own rows remain (one build, one version, one docs listing).
    expect([await count("builds"), await count("versions"), await count("approvals")]).toEqual([
      1, 1, 0,
    ]);
  });
});
