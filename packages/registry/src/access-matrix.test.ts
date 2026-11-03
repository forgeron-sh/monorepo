import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, deployBuild, migratePlatform, type Registry, type Tool } from "./index";

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

const manifest = {
  roles: {
    sales: { grants: ["read", "write"] },
    viewer: { grants: ["read"] },
  },
  actions: {
    "deals.list": { access: "read" },
    "deals.move": { access: "write" },
    "deals.delete": { access: "delete" },
  },
  resources: {},
} as unknown as Build["manifest"];

const hosting: Hosting = {
  async provision(environment) {
    return { environment, bindings: [] };
  },
  async upload(provisioned, build) {
    return { provisioned, build };
  },
  async migrate() {
    return { applied: [] };
  },
  async activate() {
    return { url: "https://x.test" };
  },
  async teardown() {},
};

const publish = (fingerprint: string, version: string, branch: string) =>
  deployBuild(registry, hosting, {
    tool,
    environment: "preview",
    branch,
    build: { manifest, worker: "//", fingerprint },
    version,
    actor: "ely",
  });

describe("the roles × actions matrix", () => {
  it("shows each role against each action, from the levels of the code", async () => {
    await publish("fp1", "1.0.0", "a");
    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.roles).toEqual(["sales", "viewer"]);
    expect(matrix.actions).toEqual(["deals.list", "deals.move", "deals.delete"]);
    expect(matrix.cells.sales).toEqual({
      "deals.list": { default: true, allowed: true },
      "deals.move": { default: true, allowed: true },
      "deals.delete": { default: false, allowed: false },
    });
    expect(matrix.cells.viewer!["deals.move"]).toEqual({ default: false, allowed: false });
  });

  it("changes a cell without a new version, and gives it back to the levels", async () => {
    const { version } = await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", true, "admin-1");
    await registry.setRoleAccess(tool.id, "sales", "deals.move", false, "admin-1");

    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.cells.viewer!["deals.move"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
    expect(matrix.cells.sales!["deals.move"]).toEqual({
      default: true,
      override: false,
      allowed: false,
    });
    expect(await registry.listVersions(tool.id)).toHaveLength(1);
    expect((await registry.listVersions(tool.id))[0]!.id).toBe(version.id);

    await registry.setRoleAccess(tool.id, "viewer", "deals.move", undefined, "admin-1");
    expect((await registry.accessMatrix(tool.id)).cells.viewer!["deals.move"]).toEqual({
      default: false,
      allowed: false,
    });
  });

  it("updates a cell that was already set", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", true, "admin-1");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", false, "admin-2");
    expect(await registry.roleAccess(tool.id)).toEqual({ viewer: { "deals.move": false } });
  });

  it("refuses a role or an action the tool does not have, and a tool without a version", async () => {
    await expect(registry.accessMatrix(tool.id)).rejects.toMatchObject({ code: "NO_MANIFEST" });
    await publish("fp1", "1.0.0", "a");
    await expect(
      registry.setRoleAccess(tool.id, "ghost", "deals.move", true, "admin-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      registry.setRoleAccess(tool.id, "viewer", "deals.ghost", true, "admin-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("hands the gateway only the overrides of the roles a person holds", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", true, "admin-1");
    await registry.setRoleAccess(tool.id, "sales", "deals.delete", true, "admin-1");
    expect(await registry.accessFor(tool.id, ["viewer"])).toEqual({
      viewer: { "deals.move": true },
    });
    expect(await registry.accessFor(tool.id, [])).toEqual({});
  });

  it("is dropped with the tool", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", true, "admin-1");
    await registry.deleteTool(tool.id);
    expect(await registry.roleAccess(tool.id)).toEqual({});
  });
});
