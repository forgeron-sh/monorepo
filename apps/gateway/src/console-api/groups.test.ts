import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleGroups } from "./groups";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  for (const [subject, email, roles] of [
    ["s1", "ada@acme.test", ["admin"]],
    ["s2", "bob@acme.test", []],
  ] as const) {
    await registry.addMember({ workspace: "acme", subject, email, name: email, roles: [...roles] });
  }
});
afterEach(() => memory.close());

const call = (path: string, init?: RequestInit, admin: boolean | "anonymous" = true) =>
  handleGroups(new Request(`https://acme.forgeron.app${path}`, init), {
    registry,
    workspace: "acme",
    caller: async () => (admin === "anonymous" ? undefined : { admin }),
  });
const put = (name: string, body: unknown, admin?: boolean) =>
  call(`/api/groups/${name}`, { method: "PUT", body: JSON.stringify(body) }, admin);

describe("the groups API", () => {
  it("ignores other routes", async () => {
    expect(await call("/api/tools")).toBeUndefined();
  });

  it("sets and lists the members of a group by email", async () => {
    const set = await put("early", { members: ["Bob@acme.test"] });
    expect(set?.status).toBe(200);
    const listed = await (await call("/api/groups"))!.json();
    expect(listed).toMatchObject({
      groups: [{ name: "early", members: [{ email: "bob@acme.test" }] }],
    });
    // Replacing: the group now holds Ada only.
    await put("early", { members: ["ada@acme.test"] });
    const again = (await (await call("/api/groups"))!.json()) as {
      groups: Array<{ members: Array<{ email: string }> }>;
    };
    expect(again.groups[0]!.members.map((m) => m.email)).toEqual(["ada@acme.test"]);
  });

  it("refuses an email that is not a member, and writes nothing", async () => {
    const response = await put("early", { members: ["bob@acme.test", "eve@evil.test"] });
    expect(response?.status).toBe(400);
    expect(await response!.json()).toMatchObject({ error: "UNKNOWN_MEMBER" });
    expect(await registry.listGroups("acme")).toEqual([]);
  });

  it("lists the members that can be added", async () => {
    const response = await call("/api/members");
    expect(((await response!.json()) as { members: unknown[] }).members).toHaveLength(2);
  });

  it("is for administrators only", async () => {
    expect((await call("/api/groups", undefined, "anonymous"))?.status).toBe(401);
    expect((await call("/api/groups", undefined, false))?.status).toBe(403);
    expect((await put("early", { members: [] }, false))?.status).toBe(403);
  });

  it("validates the body", async () => {
    expect((await put("early", { members: "ada@acme.test" }))?.status).toBe(400);
    expect((await put("early", { members: [1] }))?.status).toBe(400);
  });
});
