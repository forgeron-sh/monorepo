import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  createSecretBox,
  isAvailable,
  migratePlatform,
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

const ana = { id: "p-ana", roles: ["support"] };
const ben = { id: "p-ben", roles: ["reader"] };
const root = { id: "p-root", roles: ["admin"] };

describe("who may add a tool (D-117)", () => {
  it("is everyone for a tool with no rule, and as the rule says otherwise; an admin always may", () => {
    expect(isAvailable(undefined, ben)).toBe(true);
    const rule = (mode: "nobody" | "everyone" | "roles" | "people", subjects: string[] = []) => ({
      mode,
      roles: mode === "roles" ? subjects : [],
      people: mode === "people" ? subjects : [],
    });
    expect(isAvailable(rule("nobody"), ana)).toBe(false);
    expect(isAvailable(rule("nobody"), root)).toBe(true);
    expect(isAvailable(rule("everyone"), ben)).toBe(true);
    expect([ana, ben].map((p) => isAvailable(rule("roles", ["support"]), p))).toEqual([
      true,
      false,
    ]);
    expect([ana, ben].map((p) => isAvailable(rule("people", ["p-ben"]), p))).toEqual([false, true]);
  });

  it("keeps the rule, rewrites it, and audits each change", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    expect(await registry.availabilityOf(tool.id)).toBeUndefined();
    await registry.setAvailability({
      toolId: tool.id,
      mode: "roles",
      roles: ["support", "support"],
      actor: "p-root",
    });
    expect(await registry.availabilityOf(tool.id)).toMatchObject({
      mode: "roles",
      roles: ["support"],
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
      roles: [],
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
      manifest: { name: "crm", roles: {}, actions: {}, resources: {} },
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

describe("pilots (D-119)", () => {
  it("are kept per branch, apart from the tool, and removed with that branch's bindings only", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    expect(await registry.previewAvailabilityOf(tool.id, "pilot-a")).toBeUndefined();
    await registry.setPreviewAvailability({
      toolId: tool.id,
      branch: "pilot-a",
      mode: "people",
      people: [ben.id],
      actor: root.id,
    });
    expect(await registry.previewAvailabilityOf(tool.id, "pilot-a")).toMatchObject({
      people: [ben.id],
    });
    expect(await registry.previewAvailabilityOf(tool.id, "pilot-b")).toBeUndefined();
    expect(await registry.availabilityOf(tool.id)).toBeUndefined();

    await registry.installPilotForPerson({ toolId: tool.id, branch: "pilot-a", person: ben.id });
    expect(await registry.pilotsOf(ben.id)).toEqual([{ toolId: tool.id, branch: "pilot-a" }]);
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
      await registry.uninstallPilotForPerson({
        toolId: tool.id,
        branch: "pilot-a",
        person: ben.id,
      }),
    ).toBe(true);
    expect(await registry.pilotsOf(ben.id)).toEqual([]);
    // The binding of the tool itself stays; the pilot's went.
    expect(await registry.readUserSecrets(tool.id, ben.id)).toEqual({ KEY: "test-only-value" });
  });
});
