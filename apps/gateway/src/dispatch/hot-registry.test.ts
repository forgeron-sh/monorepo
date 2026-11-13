import type { Registry } from "@forgeron/registry";
import { describe, expect, it } from "vitest";
import { createHotRegistry } from "./hot-registry";

/** A registry that counts what it is asked, with the reads and the writes the gateway makes. */
function fake() {
  const calls: string[] = [];
  let tool: { id: string } | undefined = { id: "t1" };
  const registry = {
    async findTool(workspace: string, name: string) {
      calls.push(`findTool ${workspace}/${name}`);
      return tool;
    },
    async readUserSecrets(toolId: string) {
      calls.push(`readUserSecrets ${toolId}`);
      return { token: "s3cret" };
    },
    async accessFor(toolId: string) {
      calls.push(`accessFor ${toolId}`);
      return { access: {}, permissions: {} };
    },
    async deleteTool() {
      calls.push("deleteTool");
      tool = undefined;
    },
    async recordSeat() {
      calls.push("recordSeat");
    },
    async isTokenRevoked() {
      calls.push("isTokenRevoked");
      return false;
    },
    async revokeToken() {
      calls.push("revokeToken");
    },
  };
  return { registry: registry as unknown as Registry, calls, raw: registry };
}

describe("the registry of the path of a call (D-143)", () => {
  it("answers a read once for a few seconds, then asks again", async () => {
    let clock = 0;
    const { registry, calls } = fake();
    const { hot } = createHotRegistry(registry, { now: () => clock });
    await hot.findTool("acme", "crm");
    await hot.findTool("acme", "crm");
    clock = 9_999;
    await hot.findTool("acme", "crm");
    expect(calls).toEqual(["findTool acme/crm"]);
    clock = 10_000;
    await hot.findTool("acme", "crm");
    expect(calls).toHaveLength(2);
  });

  it("keeps who may be revoked for less time than the catalog", async () => {
    let clock = 0;
    const { registry, calls } = fake();
    const { hot } = createHotRegistry(registry, { now: () => clock });
    await hot.isTokenRevoked("acme", "p1", "j1", 1);
    clock = 5_000;
    await hot.isTokenRevoked("acme", "p1", "j1", 1);
    await hot.findTool("acme", "crm");
    expect(calls.filter((c) => c === "isTokenRevoked")).toHaveLength(2);
  });

  it("shares a read that is already running", async () => {
    const { registry, calls } = fake();
    const { hot } = createHotRegistry(registry);
    await Promise.all([hot.findTool("acme", "crm"), hot.findTool("acme", "crm")]);
    expect(calls).toEqual(["findTool acme/crm"]);
  });

  it("tells reads of other arguments apart", async () => {
    const { registry, calls } = fake();
    const { hot } = createHotRegistry(registry);
    await hot.findTool("acme", "crm");
    await hot.findTool("acme", "odoo");
    await hot.findTool("globex", "crm");
    expect(calls).toHaveLength(3);
  });

  it("does not make another question of the manifest an accessFor is handed", async () => {
    const { registry, calls } = fake();
    const { hot } = createHotRegistry(registry);
    await (hot.accessFor as (...a: unknown[]) => Promise<unknown>)("t1", ["everyone"], { a: 1 });
    await (hot.accessFor as (...a: unknown[]) => Promise<unknown>)("t1", ["everyone"], { a: 2 });
    expect(calls).toEqual(["accessFor t1"]);
  });

  it("never keeps a secret", async () => {
    const { registry, calls } = fake();
    const { hot } = createHotRegistry(registry);
    await hot.readUserSecrets("t1", "p1");
    await hot.readUserSecrets("t1", "p1");
    expect(calls).toEqual(["readUserSecrets t1", "readUserSecrets t1"]);
  });

  it("forgets everything at once when something is written through it", async () => {
    const { registry, calls } = fake();
    const { hot, tracked } = createHotRegistry(registry);
    expect(await hot.findTool("acme", "crm")).toEqual({ id: "t1" });
    await tracked.deleteTool("t1");
    expect(await hot.findTool("acme", "crm")).toBeUndefined();
    expect(calls).toEqual(["findTool acme/crm", "deleteTool", "findTool acme/crm"]);
    // The hot registry is no way around it: what it does not keep goes through the same door.
    await hot.findTool("acme", "crm");
    await (hot.revokeToken as (...a: unknown[]) => Promise<void>)("p1", "j1");
    await hot.findTool("acme", "crm");
    expect(calls.filter((c) => c === "findTool acme/crm")).toHaveLength(3);
  });

  it("does not forget for a counter or a read", async () => {
    const { registry, calls } = fake();
    const { hot, tracked } = createHotRegistry(registry);
    await hot.findTool("acme", "crm");
    await tracked.recordSeat("acme", "p1");
    await tracked.findTool("acme", "crm");
    await hot.findTool("acme", "crm");
    expect(calls.filter((c) => c.startsWith("findTool"))).toHaveLength(2);
  });

  it("does not keep a failure", async () => {
    const { registry, raw } = fake();
    let calls = 0;
    raw.findTool = async () => {
      calls += 1;
      if (calls === 1) throw new Error("D1 is down");
      return { id: "t1" };
    };
    const { hot } = createHotRegistry(registry);
    await expect(hot.findTool("acme", "crm")).rejects.toThrow("D1 is down");
    expect(await hot.findTool("acme", "crm")).toEqual({ id: "t1" });
  });

  it("shares what a method reads of its own with the same read made at the same time", async () => {
    const calls: string[] = [];
    const raw = {
      async currentManifest(toolId: string) {
        calls.push(`currentManifest ${toolId}`);
        return { profiles: {} };
      },
      async accessFor(this: Registry, toolId: string) {
        // As the registry does: it reads the manifest of its own, through `this`.
        await this.currentManifest(toolId);
        return { access: {}, permissions: {} };
      },
    } as unknown as Registry;
    const { hot } = createHotRegistry(raw);
    await Promise.all([hot.currentManifest("t1"), hot.accessFor("t1", ["everyone"])]);
    expect(calls).toEqual(["currentManifest t1"]);
  });
});
