import type { D1Database } from "@forgeron/hosting";
import { PLATFORM_PERMISSIONS } from "@forgeron/permissions";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmailCodes, createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let clock = new Date("2026-11-03T10:00:00Z");
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  clock = new Date("2026-11-03T10:00:00Z");
  registry = createRegistry(d1, { now: () => clock });
});
afterEach(() => memory.close());

const audit = async () =>
  (
    (await memory.prepare(`SELECT "subject", "actor" FROM "audit_log" ORDER BY "rowid"`).all())
      .results as Array<{ subject: string; actor: string }>
  ).map((r) => `${r.subject}:${r.actor}`);

const admin = (id: string) => ({ actor: id, permissions: ["*"] });

describe("members, invitations and domains (D-049, D-137)", () => {
  it("joins a member by email and audits it; two sign-ins at once make one member", async () => {
    const [a, b] = await Promise.all([
      registry.joinMember({
        workspace: "acme",
        email: "Ada@Acme.fr",
        teams: ["admin"],
        via: "admin-email",
      }),
      registry.joinMember({
        workspace: "acme",
        email: "ada@acme.fr",
        teams: ["admin"],
        via: "admin-email",
      }),
    ]);
    expect(a.id).toBe(b.id);
    expect(a.teams).toEqual(["admin"]);
    expect(await registry.listMembers("acme")).toHaveLength(1);
    expect((await registry.findMemberByEmail("acme", "ADA@acme.fr"))?.subject).toBe(
      "email:ada@acme.fr",
    );
    expect((await audit()).filter((l) => l.startsWith("member:join"))).toHaveLength(1);
  });

  it("puts a first administrator in the admin team, which every workspace has", async () => {
    const ada = await registry.joinMember({
      workspace: "acme",
      email: "ada@acme.fr",
      teams: ["admin", "no-such-team"],
      via: "admin-email",
    });
    expect(ada.teams).toEqual(["admin"]);
    expect((await registry.listTeams("acme")).map((t) => t.id)).toEqual(["admin", "developer"]);
    expect(await registry.platformPermissionsOf("acme", ada.id)).toEqual([...PLATFORM_PERMISSIONS]);
    expect((await registry.findTeam("acme", "admin"))?.members).toEqual([ada.id]);
  });

  it("keeps the last administrator: no leaving the admin team, no removal", async () => {
    const ada = await registry.joinMember({
      workspace: "acme",
      email: "ada@acme.fr",
      teams: ["admin"],
      via: "admin-email",
    });
    await expect(registry.setMemberTeams("acme", ada.id, [], "x", ["*"])).rejects.toMatchObject({
      code: "LAST_ADMIN",
    });
    await expect(registry.removeMember("acme", ada.id, "x")).rejects.toMatchObject({
      code: "LAST_ADMIN",
    });
    const bob = await registry.joinMember({
      workspace: "acme",
      email: "bob@acme.fr",
      teams: ["admin"],
      via: "invitation",
    });
    await registry.setMemberTeams("acme", ada.id, ["developer"], bob.id, ["*"]);
    expect((await registry.findMember("acme", ada.id))?.teams).toEqual(["developer"]);
    await expect(registry.removeMember("acme", bob.id, bob.id)).rejects.toMatchObject({
      code: "LAST_ADMIN",
    });
    expect(await audit()).toContain(`member:teams:${bob.id}`);
  });

  it("refuses to give a team whose permissions the actor does not hold", async () => {
    const ada = await registry.joinMember({
      workspace: "acme",
      email: "ada@acme.fr",
      teams: ["admin"],
      via: "admin-email",
    });
    const eve = await registry.joinMember({
      workspace: "acme",
      email: "eve@acme.fr",
      teams: [],
      via: "domain",
    });
    // Someone who manages members but only holds `members:write` cannot make anyone an admin,
    // nor a developer, nor take the developers' permissions away from someone.
    for (const teams of [["admin"], ["developer"]]) {
      await expect(
        registry.setMemberTeams("acme", eve.id, teams, ada.id, ["members:write"]),
      ).rejects.toMatchObject({ code: "FORBIDDEN", message: /you lack/ });
    }
    await expect(
      registry.setMemberTeams("acme", eve.id, ["nope"], ada.id, ["*"]),
    ).rejects.toMatchObject({ code: "INVALID" });
    await registry.createTeam("acme", { id: "support", name: "Support" }, ada.id, ["*"]);
    expect(
      (await registry.setMemberTeams("acme", eve.id, ["support"], ada.id, ["members:write"])).teams,
    ).toEqual(["support"]);
    // A developer-only person gives the developer team, and nothing above it.
    const developer = (await registry.findTeam("acme", "developer"))!;
    expect(
      (await registry.setMemberTeams("acme", eve.id, ["developer"], ada.id, developer.permissions))
        .teams,
    ).toEqual(["developer"]);
    await expect(
      registry.setMemberTeams("acme", eve.id, ["admin"], ada.id, developer.permissions),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("removing a member removes them, from their teams too", async () => {
    const ada = await registry.joinMember({
      workspace: "acme",
      email: "ada@acme.fr",
      teams: ["admin"],
      via: "admin-email",
    });
    const bob = await registry.joinMember({
      workspace: "acme",
      email: "bob@acme.fr",
      teams: ["developer"],
      via: "domain",
    });
    await registry.removeMember("acme", bob.id, ada.id);
    expect(await registry.findMember("acme", bob.id)).toBeUndefined();
    expect((await registry.findTeam("acme", "developer"))?.members).toEqual([]);
  });

  it("an invitation lasts until its expiry, is replaced by a new one, and is consumed by joining", async () => {
    const { actor, permissions } = admin("a");
    await registry.createTeam("acme", { id: "viewers", name: "Viewers" }, actor, permissions);
    await registry.inviteMember("acme", {
      email: "Eve@X.test",
      teams: ["viewers"],
      invitedBy: "a",
      expiresAt: new Date(clock.getTime() + 1000),
      actorPermissions: permissions,
    });
    expect((await registry.findInvitation("acme", "eve@x.test"))?.teams).toEqual(["viewers"]);
    await registry.inviteMember("acme", {
      email: "eve@x.test",
      teams: ["developer"],
      invitedBy: "a",
      expiresAt: new Date(clock.getTime() + 5000),
      actorPermissions: permissions,
    });
    expect(await registry.listInvitations("acme")).toHaveLength(1);
    clock = new Date(clock.getTime() + 2000);
    expect((await registry.findInvitation("acme", "eve@x.test"))?.teams).toEqual(["developer"]);
    clock = new Date(clock.getTime() + 10000);
    expect(await registry.findInvitation("acme", "eve@x.test")).toBeUndefined();
    await registry.inviteMember("acme", {
      email: "eve@x.test",
      teams: [],
      invitedBy: "a",
      expiresAt: new Date(clock.getTime() + 5000),
      actorPermissions: permissions,
    });
    await registry.joinMember({
      workspace: "acme",
      email: "eve@x.test",
      teams: [],
      via: "invitation",
    });
    expect(await registry.listInvitations("acme")).toEqual([]);
    await expect(
      registry.inviteMember("acme", {
        email: "EVE@x.test",
        teams: [],
        invitedBy: "a",
        expiresAt: clock,
        actorPermissions: permissions,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
  });

  it("refuses to invite into an unknown team, or one the inviter does not hold", async () => {
    const base = { email: "a@x.test", invitedBy: "a", expiresAt: clock };
    await expect(
      registry.inviteMember("acme", { ...base, teams: ["bad team"], actorPermissions: ["*"] }),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.inviteMember("acme", {
        ...base,
        teams: ["admin"],
        actorPermissions: ["members:write"],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses bad domains, and admin as a default team; keeps the default teams", async () => {
    const { actor, permissions } = admin("a");
    await registry.createTeam("acme", { id: "viewers", name: "Viewers" }, actor, permissions);
    for (const settings of [
      { domains: ["a b"], defaultTeams: [] },
      { domains: ["x.test"], defaultTeams: ["admin"] },
      { domains: ["x.test"], defaultTeams: ["ghosts"] },
    ]) {
      await expect(
        registry.setMembershipSettings("acme", settings, "a", permissions),
      ).rejects.toMatchObject({ code: "INVALID" });
    }
    expect(
      await registry.setMembershipSettings(
        "acme",
        { domains: ["X.Test", "x.test"], defaultTeams: ["viewers"] },
        "a",
        permissions,
      ),
    ).toEqual({ domains: ["x.test"], defaultTeams: ["viewers"] });
    expect(await registry.getMembershipSettings("acme")).toEqual({
      domains: ["x.test"],
      defaultTeams: ["viewers"],
    });
    expect(await registry.getMembershipSettings("other")).toBeUndefined();
    await expect(
      registry.setMembershipSettings(
        "acme",
        { domains: ["x.test"], defaultTeams: ["developer"] },
        "a",
        ["members:write"],
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("email codes", () => {
  it("counts recent requests per address and per source, and forgets old ones", async () => {
    const codes = createEmailCodes(d1, { now: () => clock });
    const base = { workspace: "acme", ttlSeconds: 600, codeHash: "h" };
    await codes.create({ ...base, id: "1", email: "a@x.test", ipHash: "i1" });
    await codes.create({ ...base, id: "2", email: "a@x.test", ipHash: "i2" });
    expect(await codes.countRecent("acme", { email: "a@x.test" }, 3600)).toBe(2);
    expect(await codes.countRecent("acme", { ipHash: "i1" }, 3600)).toBe(1);
    expect(await codes.countRecent("other", { email: "a@x.test" }, 3600)).toBe(0);
    clock = new Date(clock.getTime() + 3 * 3600 * 1000);
    expect(await codes.countRecent("acme", { email: "a@x.test" }, 3600)).toBe(0);
    await codes.create({ ...base, id: "3", email: "b@x.test", ipHash: "i3" });
    const left = (await memory.prepare(`SELECT COUNT(*) AS n FROM "email_codes"`).all())
      .results![0] as { n: number };
    expect(left.n).toBe(1);
  });

  it("weighs a try only while the code is live, and spends it once", async () => {
    const codes = createEmailCodes(d1, { now: () => clock });
    await codes.create({
      id: "1",
      workspace: "acme",
      email: "a@x.test",
      codeHash: "h",
      ipHash: "i",
      ttlSeconds: 600,
    });
    expect(await codes.attempt("1", "other", 5)).toBeUndefined();
    expect(await codes.attempt("1", "acme", 5)).toEqual({ email: "a@x.test", codeHash: "h" });
    expect(await codes.spend("1")).toBe(true);
    expect(await codes.spend("1")).toBe(false);
    expect(await codes.attempt("1", "acme", 5)).toBeUndefined();
  });
});
