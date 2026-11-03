import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, RegistryError, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let ada: string;
let bob: string;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const add = (workspace: string, name: string) =>
    registry.addMember({
      workspace,
      subject: `${workspace}-${name}`,
      email: `${name}@${workspace}.test`,
      name,
      roles: [],
    });
  ada = (await add("acme", "ada")).id;
  bob = (await add("acme", "bob")).id;
});
afterEach(() => memory.close());

describe("groups (D-034)", () => {
  it("holds the members it is given and replaces them as a whole", async () => {
    await registry.setGroupMembers("acme", "early", [ada, bob]);
    expect(await registry.isGroupMember("acme", "early", ada)).toBe(true);
    await registry.setGroupMembers("acme", "early", [bob, bob]);
    expect(await registry.isGroupMember("acme", "early", ada)).toBe(false);
    expect((await registry.listGroups("acme")).map((g) => g.members.map((m) => m.id))).toEqual([
      [bob],
    ]);
    expect(await registry.groupsOf("acme", bob)).toEqual(["early"]);
  });

  it("an empty list empties the group", async () => {
    await registry.setGroupMembers("acme", "early", [ada]);
    await registry.setGroupMembers("acme", "early", []);
    expect(await registry.listGroups("acme")).toEqual([]);
  });

  it("refuses someone who is not a member of the workspace, and changes nothing", async () => {
    await registry.setGroupMembers("acme", "early", [ada]);
    const stranger = await registry.addMember({
      workspace: "globex",
      subject: "g",
      email: "g@globex.test",
      name: "g",
      roles: [],
    });
    await expect(registry.setGroupMembers("acme", "early", [bob, stranger.id])).rejects.toThrow(
      RegistryError,
    );
    expect(await registry.isGroupMember("acme", "early", ada)).toBe(true);
    expect(await registry.isGroupMember("globex", "early", stranger.id)).toBe(false);
  });

  it("keeps each workspace's groups apart", async () => {
    await registry.setGroupMembers("acme", "early", [ada]);
    expect(await registry.listGroups("globex")).toEqual([]);
    expect(await registry.listMembers("acme")).toHaveLength(2);
  });
});
