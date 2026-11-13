import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  createSecretBox,
  isAvailable,
  mayUseChannel,
  migratePlatform,
  reachesChannelAlways,
  TEMPLATE_WORKSPACE,
  type Registry,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
let memory: MemoryD1;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  await migratePlatform(memory as unknown as D1Database);
  registry = createRegistry(memory as unknown as D1Database, {
    secrets: await createSecretBox(TEST_KEY),
  });
});
afterEach(() => memory.close());

// A person as the rules read them: their teams and their platform permissions.
const ana = { id: "p-ana", teams: ["support"], permissions: [] };
const ben = { id: "p-ben", teams: ["reader"], permissions: [] };
const root = { id: "p-root", teams: ["admin"], permissions: ["*"] };
const dev = { id: "p-dev", teams: ["developer"], permissions: ["tools:write", "tools:read"] };

describe("who may add a tool (D-117)", () => {
  it("is everyone for a tool with no rule, and as the rule says otherwise; who may give access always may", () => {
    expect(isAvailable(undefined, ben)).toBe(true);
    const rule = (mode: "nobody" | "everyone" | "teams" | "people", subjects: string[] = []) => ({
      mode,
      teams: mode === "teams" ? subjects : [],
      people: mode === "people" ? subjects : [],
    });
    expect(isAvailable(rule("nobody"), ana)).toBe(false);
    expect(isAvailable(rule("nobody"), root)).toBe(true);
    expect(isAvailable(rule("nobody"), dev)).toBe(false);
    expect(isAvailable(rule("nobody"), { ...dev, permissions: ["access:write"] })).toBe(true);
    expect(isAvailable(rule("everyone"), ben)).toBe(true);
    expect([ana, ben].map((p) => isAvailable(rule("teams", ["support"]), p))).toEqual([
      true,
      false,
    ]);
    expect([ana, ben].map((p) => isAvailable(rule("people", ["p-ben"]), p))).toEqual([false, true]);
  });

  it("lets a holder of tools:read reach a branch's channel and tools:publish every channel", () => {
    expect(reachesChannelAlways("feat/x", dev)).toBe(true);
    expect(reachesChannelAlways("~beta", dev)).toBe(false);
    expect(reachesChannelAlways("~beta", { permissions: ["tools:publish"] })).toBe(true);
    expect(reachesChannelAlways("feat/x", ana)).toBe(false);
    // Anyone else only through the rule set on the channel.
    const rule = { mode: "teams" as const, teams: ["support"], people: [] };
    expect(mayUseChannel(rule, ana, "~beta")).toBe(true);
    expect(mayUseChannel(rule, ben, "~beta")).toBe(false);
    expect(mayUseChannel(undefined, ana, "~beta")).toBe(false);
  });

  it("keeps the rule, rewrites it, and audits each change", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    expect(await registry.availabilityOf(tool.id)).toBeUndefined();
    await registry.setAvailability({
      toolId: tool.id,
      mode: "teams",
      teams: ["support", "support"],
      actor: "p-root",
    });
    expect(await registry.availabilityOf(tool.id)).toMatchObject({
      mode: "teams",
      teams: ["support"],
      people: [],
    });
    await registry.setAvailability({
      toolId: tool.id,
      mode: "people",
      people: ["p-ben"],
      actor: "p-root",
    });
    expect(await registry.availabilityOf(tool.id)).toMatchObject({
      mode: "people",
      teams: [],
      people: ["p-ben"],
    });
    expect(await registry.listAudit(tool.id, { kind: "access" })).toHaveLength(2);
    await expect(
      registry.setAvailability({ toolId: tool.id, mode: "all" as never, actor: "p" }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("starts a tool installed from a catalogue at nobody", async () => {
    const source = await registry.createTool({ workspace: TEMPLATE_WORKSPACE, name: "crm" });
    const build = await registry.recordBuild(source.id, {
      fingerprint: "crm-1",
      manifest: { name: "crm", profiles: {}, actions: {}, resources: {} },
      worker: "// crm",
    });
    await registry.publishVersion(source.id, build.id, "1.0.0");
    const installed = await registry.installTemplate({
      workspace: "acme",
      template: "crm",
      actor: "p-root",
    });
    expect(await registry.availabilityOf(installed.tool.id)).toMatchObject({
      mode: "nobody",
      updatedBy: "p-root",
    });
  });
});

describe("a person's library", () => {
  it("adds once, removes the setup and the bindings, and keeps the person's saved secret", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.installForPerson({ toolId: tool.id, person: ana.id });
    await registry.installForPerson({ toolId: tool.id, person: ana.id });
    expect(await registry.libraryOf(ana.id)).toEqual(new Set([tool.id]));
    await registry.writeUserSetup({
      toolId: tool.id,
      person: ana.id,
      values: { firstName: "Ana" },
    });
    const secret = await registry.createPersonSecret({
      workspace: "acme",
      person: ana.id,
      label: "Odoo key",
      value: "test-only-value",
    });
    await registry.bindUserSecret({
      toolId: tool.id,
      person: ana.id,
      field: "ODOO_API_KEY",
      secretId: secret,
    });

    expect(await registry.uninstallForPerson({ toolId: tool.id, person: ana.id })).toBe(true);
    expect(await registry.isInstalled(tool.id, ana.id)).toBe(false);
    expect(await registry.readUserSetup(tool.id, ana.id)).toEqual({});
    expect(await registry.readUserSecrets(tool.id, ana.id)).toEqual({});
    expect((await registry.listPersonSecrets("acme", ana.id)).map((s) => s.id)).toContain(secret);
    expect(await registry.uninstallForPerson({ toolId: tool.id, person: ana.id })).toBe(false);
    const events = (await registry.listAudit(tool.id)).map(
      (l) => (l.detail as { event?: string })?.event,
    );
    expect(events.filter((e) => e === "library-added")).toHaveLength(1);
    expect(events).toContain("library-removed");
  });
});

describe("channel access (D-119, D-125)", () => {
  it("are kept per branch, apart from the tool, and removed with that branch's bindings only", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    expect(await registry.channelAccessOf(tool.id, "pilot-a")).toBeUndefined();
    await registry.setChannelAccess({
      toolId: tool.id,
      channel: "pilot-a",
      mode: "people",
      people: [ben.id],
      actor: root.id,
    });
    expect(await registry.channelAccessOf(tool.id, "pilot-a")).toMatchObject({
      people: [ben.id],
    });
    expect(await registry.channelAccessOf(tool.id, "pilot-b")).toBeUndefined();
    expect(await registry.availabilityOf(tool.id)).toBeUndefined();

    await registry.installChannelForPerson({ toolId: tool.id, channel: "pilot-a", person: ben.id });
    expect(await registry.channelsOf(ben.id)).toEqual([{ toolId: tool.id, channel: "pilot-a" }]);
    expect(await registry.isInstalled(tool.id, ben.id)).toBe(false);

    const secret = await registry.createPersonSecret({
      workspace: "acme",
      person: ben.id,
      label: "Odoo key",
      value: "test-only-value",
    });
    for (const scope of ["*", "preview:pilot-a"]) {
      await registry.bindUserSecret({
        toolId: tool.id,
        person: ben.id,
        field: "KEY",
        secretId: secret,
        scope,
      });
    }
    expect(
      await registry.uninstallChannelForPerson({
        toolId: tool.id,
        channel: "pilot-a",
        person: ben.id,
      }),
    ).toBe(true);
    expect(await registry.channelsOf(ben.id)).toEqual([]);
    // The binding of the tool itself stays; the pilot's went.
    expect(await registry.readUserSecrets(tool.id, ben.id)).toEqual({ KEY: "test-only-value" });
  });

  it("names a permanent channel by ~<name>, apart from a branch of the same name", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setChannelAccess({
      toolId: tool.id,
      channel: "~staging",
      mode: "everyone",
      actor: root.id,
    });
    expect(await registry.channelAccessOf(tool.id, "~staging")).toMatchObject({ mode: "everyone" });
    expect(await registry.channelAccessOf(tool.id, "staging")).toBeUndefined();
    await registry.installChannelForPerson({
      toolId: tool.id,
      channel: "~staging",
      person: ben.id,
    });
    expect(await registry.isChannelInstalled(tool.id, "staging", ben.id)).toBe(false);
    expect(await registry.channelsOf(ben.id)).toEqual([{ toolId: tool.id, channel: "~staging" }]);
  });
});
