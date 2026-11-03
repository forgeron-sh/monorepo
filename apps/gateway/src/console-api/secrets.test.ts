import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSecrets } from "./secrets";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let registry: Registry;
let admin = true;
let anonymous = false;

const call = (method: string, path: string, body?: unknown) =>
  handleSecrets(
    new Request(`https://acme.forgeron.test${path}`, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    {
      registry,
      workspace: "acme",
      caller: async () => (anonymous ? undefined : { admin }),
    },
  );

beforeEach(async () => {
  admin = true;
  anonymous = false;
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY) });
  await registry.createTool({ workspace: "acme", name: "crm" });
});
afterEach(() => memory.close());

const base = "/api/tools/crm/environments/production/secrets";

describe("secrets API", () => {
  it("stores a value and lists names only", async () => {
    expect((await call("PUT", `${base}/ODOO_KEY`, { value: "test-only-value" }))?.status).toBe(204);
    const response = await call("GET", base);
    const text = await response!.text();
    expect(JSON.parse(text)).toEqual({ secrets: ["ODOO_KEY"] });
    expect(text).not.toContain("test-only-value");
  });

  it("keeps environments apart", async () => {
    await call("PUT", `${base}/A`, { value: "x" });
    const pilot = await call("GET", "/api/tools/crm/environments/pilot/secrets");
    expect(await pilot!.json()).toEqual({ secrets: [] });
  });

  it("refuses anonymous callers and non-admins", async () => {
    anonymous = true;
    expect((await call("GET", base))?.status).toBe(401);
    anonymous = false;
    admin = false;
    expect((await call("PUT", `${base}/A`, { value: "x" }))?.status).toBe(403);
    expect(
      await registry.secretNames((await registry.findTool("acme", "crm"))!.id, "production"),
    ).toEqual([]);
  });

  it("refuses an unknown tool, a bad body and a wrong method", async () => {
    expect((await call("GET", "/api/tools/nope/environments/pilot/secrets"))?.status).toBe(404);
    expect((await call("PUT", `${base}/A`, { value: "" }))?.status).toBe(400);
    expect((await call("PUT", `${base}/A`, {}))?.status).toBe(400);
    expect((await call("DELETE", `${base}/A`))?.status).toBe(405);
  });

  it("ignores other routes", async () => {
    expect(await call("GET", "/api/tools/crm")).toBeUndefined();
    expect(await call("PUT", `${base}/lowercase`, { value: "x" })).toBeUndefined();
  });
});
