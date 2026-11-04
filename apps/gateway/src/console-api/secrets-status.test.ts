import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { platformCaller } from "../platform/test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let registry: Registry;
let caller: { developer: boolean; admin: boolean } | undefined;

const call = (path = "/api/tools/crm/secrets-status", method = "GET") =>
  platformCaller({ registry, who: () => caller })(
    new Request(`https://acme.forgeron.test${path}`, { method }),
  );

beforeEach(async () => {
  caller = { developer: true, admin: false };
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY) });
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest: { name: "crm", resources: { secrets: { ODOO_KEY: {} } } },
  });
  await registry.publishVersion(tool.id, build.id, "1.0.0");
  await registry.setSecret(tool.id, "preview", "ODOO_KEY", "test-only-value");
});
afterEach(() => memory.close());

describe("secrets status API", () => {
  it("answers set or missing per environment and never a value", async () => {
    const response = await call();
    const text = await response!.text();
    expect(JSON.parse(text)).toEqual({
      secrets: [
        {
          name: "ODOO_KEY",
          environments: { preview: "set", production: "missing" },
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
