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
  for (const id of ["support", "audit", "guests"]) {
    await registry.createTeam("acme", { id, name: id[0]!.toUpperCase() + id.slice(1) }, "ely", [
      "*",
    ]);
  }
});
afterEach(() => memory.close());

const manifest = {
  profiles: {
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

describe("what subjects are given in a tool (D-127, D-136)", () => {
  it("gives a new tool its default grants: the admin team all, everyone the default profile", async () => {
    await publish("fp1", "1.0.0", "a");
    expect(await registry.accessGrants(tool.id)).toEqual({
      "team:admin": { kind: "all" },
      everyone: { kind: "profile", profile: "viewer" },
    });
    const matrix = await registry.accessMatrix(tool.id);
    // Everyone first, then the teams by name, the built-in ones included.
    expect(matrix.subjects).toEqual([
      "everyone",
      "team:admin",
      "team:audit",
      "team:developer",
      "team:guests",
      "team:support",
    ]);
    expect(matrix.subjectLabels).toEqual({
      everyone: "Everyone",
      "team:admin": "Admins",
      "team:audit": "Audit",
      "team:developer": "Developers",
      "team:guests": "Guests",
      "team:support": "Support",
    });
    expect(matrix.permissions).toEqual(["delete", "read", "write"]);
    expect(matrix.profiles).toEqual({
      sales: { grants: ["read", "write"], default: false },
      viewer: { grants: ["read"], default: true },
    });
    expect(matrix.columns).toEqual(["deals.list", "deals.move", "deals.delete"]);
    expect(matrix.levels).toEqual({
      "deals.list": "read",
      "deals.move": "write",
      "deals.delete": "delete",
    });
    expect(matrix.cells["team:admin"]!["deals.delete"]).toEqual({ default: true, allowed: true });
    expect(matrix.cells.everyone!["deals.list"]).toEqual({ default: true, allowed: true });
    expect(matrix.cells.everyone!["deals.move"]).toEqual({ default: false, allowed: false });
    expect(matrix.grants["team:support"]).toEqual({ kind: "none" });
  });

  it("keeps the grants already written when a new version arrives", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessGrants(
      tool.id,
      [{ subject: "team:admin", grant: { kind: "none" } }],
      "ely",
    );
    await publish("fp2", "1.0.1", "a");
    expect((await registry.accessGrants(tool.id))["team:admin"]).toEqual({ kind: "none" });
  });

  it("gives a team a profile, custom permissions, all or nothing", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessGrants(
      tool.id,
      [
        { subject: "team:support", grant: { kind: "profile", profile: "sales" } },
        { subject: "team:audit", grant: { kind: "custom", permissions: ["read", "delete"] } },
        { subject: "everyone", grant: { kind: "none" } },
      ],
      "ely",
    );
    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.grants["team:audit"]).toEqual({
      kind: "custom",
      permissions: ["delete", "read"],
    });
    expect(matrix.cells["team:support"]!["deals.move"]!.allowed).toBe(true);
    expect(matrix.cells["team:audit"]!["deals.delete"]!.allowed).toBe(true);
    expect(matrix.cells["team:audit"]!["deals.move"]!.allowed).toBe(false);
    expect(matrix.cells.everyone!["deals.list"]!.allowed).toBe(false);
  });

  it("refuses a profile or a permission the tool does not have, and a bad or unknown subject", async () => {
    await publish("fp1", "1.0.0", "a");
    const set = (
      subject: string,
      grant: Parameters<Registry["setAccessGrants"]>[1][number]["grant"],
    ) => registry.setAccessGrants(tool.id, [{ subject, grant }], "ely");
    await expect(set("team:support", { kind: "profile", profile: "ghost" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      set("team:support", { kind: "custom", permissions: ["fly"] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(set("member", { kind: "all" })).rejects.toMatchObject({ code: "INVALID" });
    await expect(set("team-support", { kind: "all" })).rejects.toMatchObject({ code: "INVALID" });
    await expect(set("team:ghosts", { kind: "all" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(Object.keys(await registry.accessGrants(tool.id))).toEqual(["everyone", "team:admin"]);
  });

  it("audits each change of the grants with what it was and what it became", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessGrants(
      tool.id,
      [{ subject: "everyone", grant: { kind: "profile", profile: "sales" } }],
      "ely",
    );
    const log = await registry.listAudit(tool.id, { kind: "access" });
    expect(log.map((e) => [e.actor, e.subject, e.detail])).toEqual([
      [
        "ely",
        "grant:everyone",
        {
          subject: "everyone",
          from: { kind: "profile", profile: "viewer" },
          to: { kind: "profile", profile: "sales" },
        },
      ],
    ]);
  });

  it("changes the grants and the cells in one batch: a bad entry changes nothing", async () => {
    await publish("fp1", "1.0.0", "a");
    await expect(
      registry.updateAccess(
        tool.id,
        {
          grants: [{ subject: "team:support", grant: { kind: "all" } }],
          changes: [{ subject: "team:support", action: "deals.ghost", allowed: true }],
        },
        "ely",
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await registry.accessGrants(tool.id))["team:support"]).toBeUndefined();
  });

  it("hands the gateway, for the person's subjects, their permissions and every action resolved", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessException(tool.id, "everyone", "deals.move", true, "admin-1");
    expect(await registry.accessFor(tool.id, ["everyone", "team:stranger"])).toEqual({
      permissions: { everyone: ["read"], "team:stranger": [] },
      access: {
        everyone: { "deals.list": true, "deals.move": true, "deals.delete": false },
        "team:stranger": { "deals.list": false, "deals.move": false, "deals.delete": false },
      },
    });
    expect(await registry.accessFor(tool.id, [])).toEqual({ permissions: {}, access: {} });
    expect(
      (await registry.accessFor(tool.id, ["everyone", "team:admin"])).access["team:admin"],
    ).toEqual({
      "deals.list": true,
      "deals.move": true,
      "deals.delete": true,
    });
  });

  it("goes with a deleted team: its grants and exceptions", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessGrants(
      tool.id,
      [{ subject: "team:support", grant: { kind: "all" } }],
      "ely",
    );
    await registry.setAccessException(tool.id, "team:support", "deals.move", false, "ely");
    await registry.deleteTeam("acme", "support", "ely");
    expect(Object.keys(await registry.accessGrants(tool.id))).toEqual(["everyone", "team:admin"]);
    expect(await registry.accessExceptions(tool.id)).toEqual({});
    expect((await registry.accessMatrix(tool.id)).subjects).not.toContain("team:support");
  });
});

describe("the per-action exceptions", () => {
  it("changes a cell without a new version, and gives it back to the grant", async () => {
    const { version } = await publish("fp1", "1.0.0", "a");
    await registry.setAccessGrants(
      tool.id,
      [
        { subject: "team:support", grant: { kind: "profile", profile: "sales" } },
        { subject: "team:guests", grant: { kind: "profile", profile: "viewer" } },
      ],
      "admin-1",
    );
    await registry.setAccessException(tool.id, "team:guests", "deals.move", true, "admin-1");
    await registry.setAccessException(tool.id, "team:support", "deals.move", false, "admin-1");

    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.cells["team:guests"]!["deals.move"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
    expect(matrix.cells["team:support"]!["deals.move"]).toEqual({
      default: true,
      override: false,
      allowed: false,
    });
    expect(await registry.listVersions(tool.id)).toHaveLength(1);
    expect((await registry.listVersions(tool.id))[0]!.id).toBe(version.id);

    await registry.setAccessException(tool.id, "team:guests", "deals.move", undefined, "admin-1");
    expect((await registry.accessMatrix(tool.id)).cells["team:guests"]!["deals.move"]).toEqual({
      default: false,
      allowed: false,
    });
  });

  it("shows a subject with exceptions only, given nothing else", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessException(tool.id, "team:guests", "deals.list", true, "admin-1");
    const matrix = await registry.accessMatrix(tool.id);
    expect(matrix.grants["team:guests"]).toEqual({ kind: "none" });
    expect(matrix.cells["team:guests"]!["deals.list"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
  });

  it("updates a cell that was already set", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessException(tool.id, "team:guests", "deals.move", true, "admin-1");
    await registry.setAccessException(tool.id, "team:guests", "deals.move", false, "admin-2");
    expect(await registry.accessExceptions(tool.id)).toEqual({
      "team:guests": { "deals.move": false },
    });
  });

  it("refuses a bad subject or an action the tool does not have, and a tool without a version", async () => {
    await expect(registry.accessMatrix(tool.id)).rejects.toMatchObject({ code: "NO_MANIFEST" });
    await publish("fp1", "1.0.0", "a");
    await expect(
      registry.setAccessException(tool.id, "no space", "deals.move", true, "admin-1"),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.setAccessException(tool.id, "team:guests", "deals.ghost", true, "admin-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("writes each change in the audit log, with what it was and what it became", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessException(tool.id, "everyone", "deals.move", true, "admin-1");
    await registry.setAccessException(tool.id, "everyone", "deals.move", undefined, "admin-2");
    const log = await registry.listAudit(tool.id, { kind: "access" });
    expect(log.map((e) => [e.actor, e.subject, e.detail])).toEqual([
      [
        "admin-2",
        "everyone:deals.move",
        { subject: "everyone", action: "deals.move", from: true, to: false },
      ],
      [
        "admin-1",
        "everyone:deals.move",
        { subject: "everyone", action: "deals.move", from: false, to: true },
      ],
    ]);
  });

  it("keeps the older audit lines when the log learns the access kind", async () => {
    await publish("fp1", "1.0.0", "a");
    expect((await registry.listAudit(tool.id, { kind: "deployment" })).length).toBeGreaterThan(0);
  });

  it("is dropped with the tool, with the grants", async () => {
    await publish("fp1", "1.0.0", "a");
    await registry.setAccessException(tool.id, "team:guests", "deals.move", true, "admin-1");
    await registry.deleteTool(tool.id);
    expect(await registry.accessExceptions(tool.id)).toEqual({});
    expect(
      (
        await memory
          .prepare(`SELECT * FROM "access_grants" WHERE "tool_id" = ?`)
          .bind(tool.id)
          .all()
      ).results,
    ).toEqual([]);
  });
});
