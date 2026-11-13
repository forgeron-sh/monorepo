import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, createSecretBox, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
let memory: MemoryD1;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY) });
});
afterEach(() => memory.close());

const member = async (subject: string, teams: string[] = []) =>
  (
    await registry.addMember({
      workspace: "acme",
      subject,
      email: `${subject}@acme.test`,
      name: subject,
      teams,
    })
  ).id;

describe("per-person plain values (D-097)", () => {
  it("keeps one person's values per tool, replaces them, and removes one given an empty string", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    const other = await registry.createTool({ workspace: "acme", name: "hr" });
    await registry.writeUserSetup({
      toolId: tool.id,
      person: "p1",
      values: { firstName: "Ana", team: "sales" },
    });
    await registry.writeUserSetup({ toolId: tool.id, person: "p2", values: { firstName: "Ben" } });
    await registry.writeUserSetup({
      toolId: other.id,
      person: "p1",
      values: { firstName: "Anna" },
    });
    expect(await registry.readUserSetup(tool.id, "p1")).toEqual({
      firstName: "Ana",
      team: "sales",
    });
    expect(await registry.readUserSetup(other.id, "p1")).toEqual({ firstName: "Anna" });

    await registry.writeUserSetup({
      toolId: tool.id,
      person: "p1",
      values: { firstName: "Ann", team: "" },
    });
    expect(await registry.readUserSetup(tool.id, "p1")).toEqual({ firstName: "Ann" });
    expect(await registry.listUserSetup(tool.id)).toEqual([
      { person: "p1", values: { firstName: "Ann" } },
      { person: "p2", values: { firstName: "Ben" } },
    ]);
  });

  it("audits the names a person set and never a value", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.writeUserSetup({
      toolId: tool.id,
      person: "p1",
      values: { firstName: "Ana-secret-looking-value" },
      via: "Forgeron MCP",
    });
    const lines = await registry.listAudit(tool.id);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ actor: "p1", kind: "access", subject: "setup:set" });
    expect(JSON.stringify(lines)).not.toContain("Ana-secret-looking-value");
  });

  it("lets an admin clear one value or all of a person's, and says how many it cleared", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.writeUserSetup({
      toolId: tool.id,
      person: "p1",
      values: { firstName: "Ana", team: "sales" },
    });
    expect(await registry.clearUserSetup(tool.id, "p1", "team")).toBe(1);
    expect(await registry.clearUserSetup(tool.id, "p1", "team")).toBe(0);
    expect(await registry.clearUserSetup(tool.id, "p1")).toBe(1);
    expect(await registry.readUserSetup(tool.id, "p1")).toEqual({});
  });

  it("goes with the person: removing a member removes their values and their sealed secrets", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    const ana = await member("ana");
    const ben = await member("ben");
    const admin = await member("root", ["admin"]);
    for (const person of [ana, ben]) {
      await registry.writeUserSetup({ toolId: tool.id, person, values: { firstName: person } });
      await registry.setUserSecret({ toolId: tool.id, person, name: "ODOO_API_KEY", value: "v" });
    }
    await registry.removeMember("acme", ana, admin);
    expect(await registry.readUserSetup(tool.id, ana)).toEqual({});
    expect(await registry.readUserSecrets(tool.id, ana)).toEqual({});
    // Nobody else's.
    expect(await registry.readUserSetup(tool.id, ben)).toEqual({ firstName: ben });
    expect(await registry.readUserSecrets(tool.id, ben)).toEqual({ ODOO_API_KEY: "v" });
  });

  it("refuses a tool that does not exist", async () => {
    await expect(
      registry.writeUserSetup({ toolId: "ghost", person: "p1", values: { a: "b" } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
