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

describe("the mapping of workspace roles to profiles (D-127)", () => {
  it("gives a new tool its default mapping: admin all, member the default profile", async () => {
    await publish("fp1", "1.0.0", "a");
    expect(await registry.roleProfiles(tool.id)).toEqual({
      admin: { kind: "all" },
      member: { kind: "profile", profile: "viewer" },
    });
    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.roles).toEqual(["admin", "member"]);
    expect(matrix.permissions).toEqual(["delete", "read", "write"]);
    expect(matrix.profiles).toEqual({
      sales: { grants: ["read", "write"], default: false },
      viewer: { grants: ["read"], default: true },
    });
    expect(matrix.levels).toEqual({
      "deals.list": "read",
      "deals.move": "write",
      "deals.delete": "delete",
    });
    expect(matrix.cells.admin!["deals.delete"]).toEqual({ default: true, allowed: true });
    expect(matrix.cells.member!["deals.list"]).toEqual({ default: true, allowed: true });
    expect(matrix.cells.member!["deals.move"]).toEqual({ default: false, allowed: false });
  });

  it("keeps a mapping already written when a new version arrives", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleProfiles(tool.id, [{ role: "admin", grant: { kind: "none" } }], "ely");
    await publish("fp2", "1.0.1", "a");
    expect((await registry.roleProfiles(tool.id)).admin).toEqual({ kind: "none" });
  });

  it("maps a workspace role to a profile, custom permissions, all or nothing", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleProfiles(
      tool.id,
      [
        { role: "support", grant: { kind: "profile", profile: "sales" } },
        { role: "audit", grant: { kind: "custom", permissions: ["read", "delete"] } },
        { role: "member", grant: { kind: "none" } },
      ],
      "ely",
    );
    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.roles).toEqual(["admin", "member", "audit", "support"]);
    expect(matrix.mapping.audit).toEqual({ kind: "custom", permissions: ["delete", "read"] });
    expect(matrix.cells.support!["deals.move"]!.allowed).toBe(true);
    expect(matrix.cells.audit!["deals.delete"]!.allowed).toBe(true);
    expect(matrix.cells.audit!["deals.move"]!.allowed).toBe(false);
    expect(matrix.cells.member!["deals.list"]!.allowed).toBe(false);
  });

  it("refuses a profile or a permission the tool does not have, and a malformed role", async () => {
    await publish("fp1", "1.0.0", "a");
    const set = (
      role: string,
      grant: Parameters<Registry["setRoleProfiles"]>[1][number]["grant"],
    ) => registry.setRoleProfiles(tool.id, [{ role, grant }], "ely");
    await expect(set("support", { kind: "profile", profile: "ghost" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(set("support", { kind: "custom", permissions: ["fly"] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(set("no space", { kind: "all" })).rejects.toMatchObject({ code: "INVALID" });
    expect(Object.keys(await registry.roleProfiles(tool.id))).toEqual(["admin", "member"]);
  });

  it("audits each change of the mapping with what it was and what it became", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleProfiles(
      tool.id,
      [{ role: "member", grant: { kind: "profile", profile: "sales" } }],
      "ely",
    );
    const log = await registry.listAudit(tool.id, { kind: "access" });
    expect(log.map((e) => [e.actor, e.subject, e.detail])).toEqual([
      [
        "ely",
        "profile:member",
        {
          role: "member",
          from: { kind: "profile", profile: "viewer" },
          to: { kind: "profile", profile: "sales" },
        },
      ],
    ]);
  });

  it("changes the mapping and the cells in one batch: a bad entry changes nothing", async () => {
    await publish("fp1", "1.0.0", "a");
    await expect(
      registry.updateAccess(
        tool.id,
        {
          profiles: [{ role: "support", grant: { kind: "all" } }],
          changes: [{ role: "support", action: "deals.ghost", allowed: true }],
        },
        "ely",
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await registry.roleProfiles(tool.id)).support).toBeUndefined();
  });

  it("hands the gateway, for the person's roles, their permissions and every action resolved", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "member", "deals.move", true, "admin-1");
    expect(await registry.accessFor(tool.id, ["member", "stranger"])).toEqual({
      permissions: { member: ["read"], stranger: [] },
      access: {
        member: { "deals.list": true, "deals.move": true, "deals.delete": false },
        stranger: { "deals.list": false, "deals.move": false, "deals.delete": false },
      },
    });
    expect(await registry.accessFor(tool.id, [])).toEqual({ permissions: {}, access: {} });
    expect((await registry.accessFor(tool.id, ["admin"])).access.admin).toEqual({
      "deals.list": true,
      "deals.move": true,
      "deals.delete": true,
    });
  });
});

describe("the per-action exceptions", () => {
  it("changes a cell without a new version, and gives it back to the mapping", async () => {
    const { version } = await publish("fp1", "1.0.0", "a");
    await registry.setRoleProfiles(
      tool.id,
      [
        { role: "sales", grant: { kind: "profile", profile: "sales" } },
        { role: "viewer", grant: { kind: "profile", profile: "viewer" } },
      ],
      "admin-1",
    );
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

  it("shows a role with exceptions only, given nothing else", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "guest", "deals.list", true, "admin-1");
    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.mapping.guest).toEqual({ kind: "none" });
    expect(matrix.cells.guest!["deals.list"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
  });

  it("updates a cell that was already set", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", true, "admin-1");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", false, "admin-2");
    expect(await registry.roleAccess(tool.id)).toEqual({ viewer: { "deals.move": false } });
  });

  it("refuses a malformed role or an action the tool does not have, and a tool without a version", async () => {
    await expect(registry.accessMatrix(tool.id)).rejects.toMatchObject({ code: "NO_MANIFEST" });
    await publish("fp1", "1.0.0", "a");
    await expect(
      registry.setRoleAccess(tool.id, "no space", "deals.move", true, "admin-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      registry.setRoleAccess(tool.id, "viewer", "deals.ghost", true, "admin-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("writes each change in the audit log, with what it was and what it became", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "member", "deals.move", true, "admin-1");
    await registry.setRoleAccess(tool.id, "member", "deals.move", undefined, "admin-2");
    const log = await registry.listAudit(tool.id, { kind: "access" });
    expect(log.map((e) => [e.actor, e.subject, e.detail])).toEqual([
      [
        "admin-2",
        "member:deals.move",
        { role: "member", action: "deals.move", from: true, to: false },
      ],
      [
        "admin-1",
        "member:deals.move",
        { role: "member", action: "deals.move", from: false, to: true },
      ],
    ]);
  });

  it("keeps the older audit lines when the log learns the access kind", async () => {
    await publish("fp1", "1.0.0", "a");
    expect((await registry.listAudit(tool.id, { kind: "deployment" })).length).toBeGreaterThan(0);
  });

  it("is dropped with the tool, with the mapping", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setRoleAccess(tool.id, "viewer", "deals.move", true, "admin-1");
    await registry.deleteTool(tool.id);
    expect(await registry.roleAccess(tool.id)).toEqual({});
    expect(
      (
        await memory
          .prepare(`SELECT * FROM "role_profiles" WHERE "tool_id" = ?`)
          .bind(tool.id)
          .all()
      ).results,
    ).toEqual([]);
  });
});
