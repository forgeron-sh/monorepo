import type { D1Database } from "@forgeron/hosting";
import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let mf: Miniflare;
let registry: Registry;
let clock = new Date("2026-11-03T10:00:00Z");
beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  const d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => clock });
});
afterEach(() => mf.dispose());

describe("audit log", () => {
  it("keeps who did what to which version of a tool, in order", async () => {
    const crm = await registry.createTool({ workspace: "acme", name: "crm" });
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.recordAudit({
      actor: "deploy:ci",
      action: "deploy",
      toolId: crm.id,
      environment: "production",
      version: "1.0.0",
    });
    clock = new Date("2026-11-03T11:00:00Z");
    await registry.recordAudit({
      actor: "deploy:ci",
      action: "deploy.failed",
      toolId: crm.id,
      environment: "preview",
      branch: "feat/a",
      version: "1.1.0",
      detail: "migration failed",
    });
    await registry.recordAudit({ actor: "u1", action: "deploy", toolId: odoo.id });

    expect(await registry.listAudit(crm.id)).toEqual([
      {
        id: expect.any(String),
        at: "2026-11-03T10:00:00.000Z",
        actor: "deploy:ci",
        action: "deploy",
        toolId: crm.id,
        environment: "production",
        version: "1.0.0",
      },
      {
        id: expect.any(String),
        at: "2026-11-03T11:00:00.000Z",
        actor: "deploy:ci",
        action: "deploy.failed",
        toolId: crm.id,
        environment: "preview",
        branch: "feat/a",
        version: "1.1.0",
        detail: "migration failed",
      },
    ]);
  });
});
