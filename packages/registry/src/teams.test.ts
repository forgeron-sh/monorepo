import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let ada: string;
let bob: string;
const ALL = ["*"];

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const add = (subject: string, email: string, teams: string[]) =>
    registry.addMember({ workspace: "acme", subject, email, name: subject, teams });
  ada = (await add("ada", "ada@acme.test", ["admin"])).id;
  bob = (await add("bob", "bob@acme.test", [])).id;
});
afterAll(() => memory.close());

describe("teams (D-132, D-137)", () => {
  it("are named groups of the workspace's members, and only of its members", async () => {
    const team = await registry.createTeam(
      "acme",
      { id: "product", name: "Product", members: [ada] },
      "admin",
      ALL,
    );
    expect(team).toMatchObject({
      id: "product",
      name: "Product",
      members: [ada],
      builtIn: false,
      locked: false,
      permissions: [],
      effective: [],
    });
    await expect(
      registry.createTeam(
        "acme",
        { id: "other", name: "Other", members: ["stranger"] },
        "admin",
        ALL,
      ),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.createTeam("acme", { id: "product", name: "Again" }, "admin", ALL),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    for (const id of ["Bad Slug", "everyone", "a"]) {
      await expect(
        registry.createTeam("acme", { id, name: "x" }, "admin", ALL),
      ).rejects.toMatchObject({ code: "INVALID" });
    }
  });

  it("every workspace has the admin and developer teams, built in", async () => {
    const [admin, developer] = await registry.listTeams("acme");
    expect(admin).toMatchObject({
      id: "admin",
      name: "Admins",
      builtIn: true,
      locked: true,
      permissions: ["*"],
      members: [ada],
    });
    expect(admin?.effective).toHaveLength(18);
    expect(developer).toMatchObject({ id: "developer", builtIn: true, locked: false });
    expect(developer?.permissions).toContain("tools:publish");
    await expect(
      registry.createTeam("acme", { id: "admin", name: "x" }, "admin", ALL),
    ).rejects.toMatchObject({
      code: "ALREADY_EXISTS",
    });
  });

  it("change members, tell a member which teams they are in, and leave with the member", async () => {
    await registry.updateTeam(
      "acme",
      "product",
      { members: [ada, bob], name: "Product & design" },
      "admin",
      ALL,
    );
    expect((await registry.findTeam("acme", "product"))?.members).toEqual([ada, bob].sort());
    expect(await registry.teamsOfMember("acme", bob)).toEqual(["product"]);
    await registry.removeMember("acme", bob, "admin");
    expect((await registry.findTeam("acme", "product"))?.members).toEqual([ada]);
  });

  it("give platform permissions: a person holds what any of their teams holds", async () => {
    const team = await registry.setTeamPermissions(
      "acme",
      "product",
      ["tools:write", "tools:read", "members:write"],
      "admin",
      ALL,
    );
    // The fewest grants: a write gives its read.
    expect(team.permissions).toEqual(["tools:write", "members:write"]);
    expect(team.effective).toEqual(["tools:read", "tools:write", "members:read", "members:write"]);
    const eve = (
      await registry.addMember({
        workspace: "acme",
        subject: "eve",
        email: "eve@acme.test",
        name: "eve",
        teams: ["product", "developer"],
      })
    ).id;
    expect(await registry.platformPermissionsOf("acme", eve)).toEqual([
      "tools:read",
      "tools:write",
      "tools:publish",
      "tools:data",
      "access:read",
      "members:read",
      "members:write",
      "marketplace:read",
    ]);
    expect(await registry.platformPermissionsOf("acme", "stranger")).toEqual([]);
    await expect(
      registry.setTeamPermissions("acme", "product", ["tools:fly"], "admin", ALL),
    ).rejects.toMatchObject({ code: "INVALID" });
    await registry.removeMember("acme", eve, "admin");
  });

  it("only the permissions the actor holds are given or taken away (anti-escalation)", async () => {
    const manager = ["teams:write", "tools:write"];
    await expect(
      registry.setTeamPermissions(
        "acme",
        "product",
        ["tools:write", "members:write", "audit:read"],
        "ada",
        manager,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: /members:write/ });
    // Taking away what one does not hold is refused too: the team's permissions before count.
    await expect(
      registry.setTeamPermissions("acme", "product", ["tools:write"], "ada", manager),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const carl = (
      await registry.addMember({
        workspace: "acme",
        subject: "carl",
        email: "carl@acme.test",
        name: "carl",
        teams: [],
      })
    ).id;
    await expect(
      registry.updateTeam("acme", "product", { members: [ada, carl] }, "ada", manager),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      registry.createTeam(
        "acme",
        { id: "ops", name: "Ops", permissions: ["audit:read"] },
        "ada",
        manager,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    // A team with nothing to hold can be managed by anyone who may manage teams.
    await registry.createTeam("acme", { id: "ops", name: "Ops" }, "ada", manager);
    await registry.setTeamPermissions("acme", "ops", ["tools:read"], "ada", manager);
    expect((await registry.findTeam("acme", "ops"))?.permissions).toEqual(["tools:read"]);
    expect(
      (await registry.setTeamPermissions("acme", "ops", [], "ada", manager)).permissions,
    ).toEqual([]);
    await registry.deleteTeam("acme", "ops", "ada");
  });

  it("protect the built-in teams: no deleting, admin keeps every permission and a member", async () => {
    await expect(registry.deleteTeam("acme", "admin", "admin")).rejects.toMatchObject({
      code: "PROTECTED",
    });
    await expect(registry.deleteTeam("acme", "developer", "admin")).rejects.toMatchObject({
      code: "PROTECTED",
    });
    await expect(
      registry.setTeamPermissions("acme", "admin", ["tools:read"], "admin", ALL),
    ).rejects.toMatchObject({ code: "PROTECTED" });
    await expect(
      registry.updateTeam("acme", "admin", { members: [] }, "admin", ALL),
    ).rejects.toMatchObject({ code: "LAST_ADMIN" });
    // The developers' permissions are editable.
    const developer = await registry.setTeamPermissions(
      "acme",
      "developer",
      ["tools:read"],
      "admin",
      ALL,
    );
    expect(developer.permissions).toEqual(["tools:read"]);
  });

  it("audit a change of permissions", async () => {
    const lines = (
      (await memory.prepare(`SELECT "subject" FROM "audit_log" ORDER BY "rowid"`).all())
        .results as Array<{ subject: string }>
    ).map((r) => r.subject);
    expect(lines).toContain("team:permissions");
  });

  it("are deleted with what they were given in tools", async () => {
    await registry.deleteTeam("acme", "product", "admin");
    expect((await registry.listTeams("acme")).map((t) => t.id)).toEqual(["admin", "developer"]);
    await expect(registry.deleteTeam("acme", "product", "admin")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
