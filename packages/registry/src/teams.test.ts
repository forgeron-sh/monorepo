import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let ada: string;
let bob: string;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const add = (subject: string, email: string) =>
    registry.addMember({ workspace: "acme", subject, email, name: subject, roles: [] });
  ada = (await add("ada", "ada@acme.test")).id;
  bob = (await add("bob", "bob@acme.test")).id;
});
afterAll(() => memory.close());

describe("teams (D-132)", () => {
  it("are named groups of the workspace's members, and only of its members", async () => {
    const team = await registry.createTeam(
      "acme",
      { id: "product", name: "Product", members: [ada] },
      "admin",
    );
    expect(team).toMatchObject({ id: "product", name: "Product", members: [ada] });
    await expect(
      registry.createTeam("acme", { id: "other", name: "Other", members: ["stranger"] }, "admin"),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.createTeam("acme", { id: "product", name: "Again" }, "admin"),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    await expect(
      registry.createTeam("acme", { id: "Bad Slug", name: "x" }, "admin"),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("change members, tell a member which teams they are in, and leave with the member", async () => {
    await registry.updateTeam(
      "acme",
      "product",
      { members: [ada, bob], name: "Product & design" },
      "admin",
    );
    expect((await registry.findTeam("acme", "product"))?.members).toEqual([ada, bob].sort());
    expect(await registry.teamsOfMember("acme", bob)).toEqual(["product"]);
    await registry.removeMember("acme", bob, "admin");
    expect((await registry.findTeam("acme", "product"))?.members).toEqual([ada]);
  });

  it("are deleted with what they were given in tools, and never named like a role", async () => {
    await expect(
      registry.setMemberRoles("acme", ada, ["team-product"], "admin"),
    ).rejects.toMatchObject({ code: "INVALID" });
    await registry.deleteTeam("acme", "product", "admin");
    expect(await registry.listTeams("acme")).toEqual([]);
    await expect(registry.deleteTeam("acme", "product", "admin")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
