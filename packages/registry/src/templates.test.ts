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
  profiles: {},
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
          (
            await (memory as unknown as D1Database)
              .prepare(`SELECT COUNT(*) AS n FROM "${table}"`)
              .all()
          ).results![0] as { n: number }
        ).n,
      );
    // Only the template's own rows remain (one build, one version, one docs listing).
    expect([await count("builds"), await count("versions"), await count("approvals")]).toEqual([
      1, 1, 0,
    ]);
  });
});

describe("install plans (D-092)", () => {
  const acme = { workspace: "acme", person: "ana" };

  it("shows what would be created, creates nothing, and audits that a plan was made", async () => {
    await publish("crm", "1.0.0", { db: { why: "deals" } });
    const plan = await registry.createInstallPlan({
      ...acme,
      template: "crm",
      via: VIA_FORGERON_MCP,
    });
    expect(plan).toMatchObject({ template: "crm", version: "1.0.0", resources: ["resources.db"] });
    expect(await registry.findTool("acme", "crm")).toBeUndefined();
  });

  it("installs the template once: the plan is spent, a second use is refused", async () => {
    await publish("crm", "1.0.0", { db: { why: "deals" } });
    const plan = await registry.createInstallPlan({ ...acme, template: "crm" });
    const installed = await registry.installFromPlan({ ...acme, plan: plan.id });
    expect(installed).toMatchObject({ tool: { name: "crm" }, version: { version: "1.0.0" } });
    expect(await registry.installFromPlan({ ...acme, plan: plan.id })).toBe("used");
  });

  it("refuses a plan that is unknown, another person's or another workspace's, with the same answer", async () => {
    await publish("crm", "1.0.0", {});
    const plan = await registry.createInstallPlan({ ...acme, template: "crm" });
    expect(await registry.installFromPlan({ ...acme, plan: "nope" })).toBe("unknown");
    expect(
      await registry.installFromPlan({ workspace: "acme", person: "ben", plan: plan.id }),
    ).toBe("unknown");
    expect(
      await registry.installFromPlan({ workspace: "other", person: "ana", plan: plan.id }),
    ).toBe("unknown");
    // None of those spent it: the right person still can.
    expect(await registry.installFromPlan({ ...acme, plan: plan.id })).toMatchObject({
      tool: { name: "crm" },
    });
  });

  it("refuses an expired plan and a plan whose template has a newer version than the one shown", async () => {
    await publish("crm", "1.0.0", {});
    let clock = new Date("2026-11-09T10:00:00Z");
    const timed = createRegistry(memory as unknown as D1Database, { now: () => clock });
    const plan = await timed.createInstallPlan({ ...acme, template: "crm" });
    clock = new Date(clock.getTime() + 16 * 60 * 1000);
    expect(await timed.installFromPlan({ ...acme, plan: plan.id })).toBe("expired");

    clock = new Date("2026-11-09T11:00:00Z");
    const fresh = await timed.createInstallPlan({ ...acme, template: "crm" });
    await publish("crm", "1.1.0", {});
    expect(await timed.installFromPlan({ ...acme, plan: fresh.id })).toBe("stale");
    expect(await timed.findTool("acme", "crm")).toBeUndefined();
  });

  it("lets only one of two parallel uses install", async () => {
    await publish("crm", "1.0.0", {});
    const plan = await registry.createInstallPlan({ ...acme, template: "crm" });
    const results = await Promise.allSettled([
      registry.installFromPlan({ ...acme, plan: plan.id }),
      registry.installFromPlan({ ...acme, plan: plan.id }),
    ]);
    const installed = results.filter(
      (r) => r.status === "fulfilled" && typeof r.value === "object",
    );
    expect(installed).toHaveLength(1);
  });

  it("refuses a plan for a template that does not exist or that the workspace already has", async () => {
    await expect(registry.createInstallPlan({ ...acme, template: "crm" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await publish("crm", "1.0.0", {});
    await registry.createTool({ workspace: "acme", name: "crm" });
    await expect(registry.createInstallPlan({ ...acme, template: "crm" })).rejects.toBeInstanceOf(
      RegistryError,
    );
  });
});
