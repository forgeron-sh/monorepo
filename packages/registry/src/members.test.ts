import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmailCodes,
  createRegistry,
  migratePlatform,
  RegistryError,
  type Registry,
} from "./index";

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

describe("members, invitations and domains (D-049)", () => {
  it("joins a member by email and audits it; two sign-ins at once make one member", async () => {
    const [a, b] = await Promise.all([
      registry.joinMember({
        workspace: "acme",
        email: "Ada@Acme.fr",
        roles: ["admin"],
        via: "admin-email",
      }),
      registry.joinMember({
        workspace: "acme",
        email: "ada@acme.fr",
        roles: ["admin"],
        via: "admin-email",
      }),
    ]);
    expect(a.id).toBe(b.id);
    expect(await registry.listMembers("acme")).toHaveLength(1);
    expect((await registry.findMemberByEmail("acme", "ADA@acme.fr"))?.subject).toBe(
      "email:ada@acme.fr",
    );
    expect((await audit()).filter((l) => l.startsWith("member:join"))).toHaveLength(1);
  });

  it("keeps the last administrator: no demotion, no removal", async () => {
    const ada = await registry.joinMember({
      workspace: "acme",
      email: "ada@acme.fr",
      roles: ["admin"],
      via: "admin-email",
    });
    await expect(registry.setMemberRoles("acme", ada.id, [], "x")).rejects.toMatchObject({
      code: "LAST_ADMIN",
    });
    await expect(registry.removeMember("acme", ada.id, "x")).rejects.toBeInstanceOf(RegistryError);
    const bob = await registry.joinMember({
      workspace: "acme",
      email: "bob@acme.fr",
      roles: ["admin"],
      via: "invitation",
    });
    await registry.setMemberRoles("acme", ada.id, ["developer"], bob.id);
    await expect(registry.removeMember("acme", bob.id, bob.id)).rejects.toMatchObject({
      code: "LAST_ADMIN",
    });
    expect(await audit()).toContain(`member:roles:${bob.id}`);
  });

  it("removing a member removes them", async () => {
    const ada = await registry.joinMember({
      workspace: "acme",
      email: "ada@acme.fr",
      roles: ["admin"],
      via: "admin-email",
    });
    const bob = await registry.joinMember({
      workspace: "acme",
      email: "bob@acme.fr",
      roles: [],
      via: "domain",
    });
    await registry.removeMember("acme", bob.id, ada.id);
    expect(await registry.findMember("acme", bob.id)).toBeUndefined();
  });

  it("an invitation lasts until its expiry, is replaced by a new one, and is consumed by joining", async () => {
    await registry.inviteMember("acme", {
      email: "Eve@X.test",
      roles: ["viewer"],
      invitedBy: "a",
      expiresAt: new Date(clock.getTime() + 1000),
    });
    expect((await registry.findInvitation("acme", "eve@x.test"))?.roles).toEqual(["viewer"]);
    await registry.inviteMember("acme", {
      email: "eve@x.test",
      roles: ["developer"],
      invitedBy: "a",
      expiresAt: new Date(clock.getTime() + 5000),
    });
    expect(await registry.listInvitations("acme")).toHaveLength(1);
    clock = new Date(clock.getTime() + 2000);
    expect((await registry.findInvitation("acme", "eve@x.test"))?.roles).toEqual(["developer"]);
    clock = new Date(clock.getTime() + 10000);
    expect(await registry.findInvitation("acme", "eve@x.test")).toBeUndefined();
    await registry.inviteMember("acme", {
      email: "eve@x.test",
      roles: [],
      invitedBy: "a",
      expiresAt: new Date(clock.getTime() + 5000),
    });
    await registry.joinMember({
      workspace: "acme",
      email: "eve@x.test",
      roles: [],
      via: "invitation",
    });
    expect(await registry.listInvitations("acme")).toEqual([]);
    await expect(
      registry.inviteMember("acme", {
        email: "EVE@x.test",
        roles: [],
        invitedBy: "a",
        expiresAt: clock,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
  });

  it("refuses bad role names and domains, and admin as a default role", async () => {
    await expect(
      registry.inviteMember("acme", {
        email: "a@x.test",
        roles: ["bad role"],
        invitedBy: "a",
        expiresAt: clock,
      }),
    ).rejects.toMatchObject({ code: "INVALID" });
    for (const settings of [{ domains: ["a b"] }, { domains: ["x.test"], defaultRole: "admin" }]) {
      await expect(registry.setMembershipSettings("acme", settings, "a")).rejects.toMatchObject({
        code: "INVALID",
      });
    }
    expect(
      await registry.setMembershipSettings(
        "acme",
        { domains: ["X.Test", "x.test"], defaultRole: "viewer" },
        "a",
      ),
    ).toEqual({
      domains: ["x.test"],
      defaultRole: "viewer",
    });
    expect(await registry.getMembershipSettings("acme")).toEqual({
      domains: ["x.test"],
      defaultRole: "viewer",
    });
    expect(await registry.getMembershipSettings("other")).toBeUndefined();
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
