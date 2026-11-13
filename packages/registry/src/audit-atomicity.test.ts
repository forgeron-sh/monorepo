import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A write and the audit line that records it go in one `d1.batch`: if the audit line cannot be
// written, the write does not happen. The trigger makes every insert in `audit_log` fail once armed;
// each case then checks that the change it attempted left no trace.
let memory: MemoryD1;
let registry: Registry;
let toolId: string;
let versionId: string;
let environmentId: string;
let memberId: string;

const arm = () =>
  memory.exec(
    `CREATE TRIGGER "fail_audit" BEFORE INSERT ON "audit_log" BEGIN SELECT RAISE(ABORT, 'audit refused'); END`,
  );

beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  toolId = tool.id;
  const build = await registry.recordBuild(toolId, {
    fingerprint: "f1",
    manifest: {
      profiles: { sales: { grants: ["read"] } },
      actions: { "deals.list": { access: "read" } },
      resources: {},
    },
  });
  versionId = (await registry.publishVersion(toolId, build.id, "1.0.0")).id;
  environmentId = (await registry.ensureEnvironment(toolId, "production")).id;
  memberId = (
    await registry.joinMember({
      workspace: "acme",
      email: "a@acme.fr",
      teams: ["admin"],
      via: "admin-email",
    })
  ).id;
  await registry.joinMember({
    workspace: "acme",
    email: "b@acme.fr",
    teams: ["admin"],
    via: "admin-email",
  });
});
afterEach(() => memory.close());

describe("a write and its audit line are one batch", () => {
  it("catalog: an activation whose audit line fails does not activate", async () => {
    await arm();
    await expect(registry.activate(environmentId, versionId, { actor: "ely" })).rejects.toThrow(
      /audit refused/,
    );
    expect((await registry.listEnvironments(toolId))[0]?.versionId).toBeUndefined();
    expect(await registry.listDeployments(toolId)).toEqual([]);
  });

  it("access: an exception whose audit line fails changes nothing", async () => {
    await arm();
    await expect(
      registry.setAccessException(toolId, "everyone", "deals.list", false, "ely"),
    ).rejects.toThrow(/audit refused/);
    expect(await registry.accessExceptions(toolId)).toEqual({});
  });

  it("members: a change of teams and a removal whose audit line fails change nothing", async () => {
    await arm();
    await expect(
      registry.setMemberTeams("acme", memberId, ["developer"], "ely", ["*"]),
    ).rejects.toThrow(/audit refused/);
    await expect(registry.removeMember("acme", memberId, "ely")).rejects.toThrow(/audit refused/);
    expect((await registry.findMember("acme", memberId))?.teams).toEqual(["admin"]);
  });

  it("approvals: a decision whose audit line fails leaves the approval pending", async () => {
    const approval = await registry.requestApproval(versionId, {
      resource: "secrets",
      kind: "secret",
    });
    await arm();
    await expect(registry.decideApproval(approval.id, "approved", "ely")).rejects.toThrow(
      /audit refused/,
    );
    expect((await registry.listApprovals(toolId))[0]?.status).toBe("pending");
  });
});
