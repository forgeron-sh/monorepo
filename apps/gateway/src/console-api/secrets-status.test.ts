import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSecretsStatus } from "./secrets-status";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let mf: Miniflare;
let registry: Registry;
let caller: { developer: boolean; admin: boolean } | undefined;

const call = (path = "/api/tools/crm/secrets-status", method = "GET") =>
  handleSecretsStatus(new Request(`https://acme.forgeron.test${path}`, { method }), {
    registry,
    workspace: "acme",
    caller: async () => caller,
  });

beforeEach(async () => {
  caller = { developer: true, admin: false };
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  const d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY) });
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest: { name: "crm", resources: { secrets: { ODOO_KEY: {} } } },
  });
  await registry.publishVersion(tool.id, build.id, "1.0.0");
  await registry.setSecret(tool.id, "pilot", "ODOO_KEY", "test-only-value");
});
afterEach(() => mf.dispose());

describe("secrets status API", () => {
  it("answers set or missing per environment and never a value", async () => {
    const response = await call();
    const text = await response!.text();
    expect(JSON.parse(text)).toEqual({
      secrets: [
        {
          name: "ODOO_KEY",
          environments: { preview: "missing", pilot: "set", production: "missing" },
        },
      ],
    });
    expect(text).not.toContain("test-only-value");
  });

  it("is for developers and admins", async () => {
    caller = { developer: false, admin: false };
    expect((await call())?.status).toBe(403);
    caller = { developer: false, admin: true };
    expect((await call())?.status).toBe(200);
    caller = undefined;
    expect((await call())?.status).toBe(401);
  });

  it("refuses an unknown tool and other methods, ignores other routes", async () => {
    expect((await call("/api/tools/nope/secrets-status"))?.status).toBe(404);
    expect((await call("/api/tools/crm/secrets-status", "PUT"))?.status).toBe(405);
    expect(await call("/api/tools/crm")).toBeUndefined();
  });
});
