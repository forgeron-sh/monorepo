import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, createSecretBox, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const VALUE = "fake-secret-value-for-tests";

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let clock = Date.UTC(2026, 10, 6, 12, 0, 0);
let toolId: string;

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  clock = Date.UTC(2026, 10, 6, 12, 0, 0);
  registry = createRegistry(d1, {
    secrets: await createSecretBox(TEST_KEY),
    now: () => new Date(clock),
  });
  toolId = (await registry.createTool({ workspace: "acme", name: "crm" })).id;
});
afterEach(() => memory.close());

const open = (person = "p-dev") =>
  registry.requestSecret({
    toolId,
    environment: "production",
    name: "ODOO_KEY",
    person,
    via: "Forgeron MCP",
  });
const audit = async () =>
  (await d1.prepare(`SELECT * FROM "audit_log" ORDER BY rowid`).all()).results as Array<
    Record<string, unknown>
  >;

describe("a request to enter a secret", () => {
  it("keeps the hash of the token, never the token", async () => {
    const { token } = await open();
    const rows = (await d1.prepare(`SELECT * FROM "secret_requests"`).all()).results;
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(JSON.stringify(await audit())).not.toContain(token);
  });

  it("sets the secret once, for the person it was issued to, and says so in the audit log", async () => {
    const { token } = await open();
    clock += 60_000;
    const info = await registry.fulfilSecretRequest("acme", token, "p-dev", VALUE);
    expect(info).toMatchObject({ toolId, environment: "production", name: "ODOO_KEY" });
    expect(await registry.readSecrets(toolId, "production")).toEqual({ ODOO_KEY: VALUE });
    const lines = await audit();
    expect(lines.map((l) => [l.actor, l.via, l.kind, l.subject, l.detail])).toEqual([
      [
        "p-dev",
        "Forgeron MCP",
        "access",
        "secret:ODOO_KEY",
        '{"event":"secret-requested","environment":"production"}',
      ],
      [
        "p-dev",
        null,
        "access",
        "secret:ODOO_KEY",
        '{"event":"secret-set","environment":"production"}',
      ],
    ]);
    // No value, no token in the log or in what is kept about the request.
    const kept = JSON.stringify([
      lines,
      (await d1.prepare(`SELECT * FROM "secret_requests"`).all()).results,
    ]);
    expect(kept).not.toContain(VALUE);
    expect(kept).not.toContain(token);
  });

  it("is single use: the second try is refused and the first value stays", async () => {
    const { token } = await open();
    await registry.fulfilSecretRequest("acme", token, "p-dev", VALUE);
    expect(await registry.fulfilSecretRequest("acme", token, "p-dev", "another-fake-value")).toBe(
      "used",
    );
    expect(await registry.secretRequest("acme", token, "p-dev")).toBe("used");
    expect(await registry.readSecrets(toolId, "production")).toEqual({ ODOO_KEY: VALUE });
    expect((await audit()).filter((l) => String(l.detail).includes("secret-set"))).toHaveLength(1);
  });

  it("lets only one of two parallel uses set a value", async () => {
    const { token } = await open();
    const results = await Promise.all([
      registry.fulfilSecretRequest("acme", token, "p-dev", "fake-one"),
      registry.fulfilSecretRequest("acme", token, "p-dev", "fake-two"),
    ]);
    expect(results.filter((r) => typeof r === "object")).toHaveLength(1);
    expect((await audit()).filter((l) => String(l.detail).includes("secret-set"))).toHaveLength(1);
  });

  it("is refused after its expiry, and sets nothing", async () => {
    const { token, expiresAt } = await open();
    expect(Date.parse(expiresAt) - clock).toBe(15 * 60 * 1000);
    clock = Date.parse(expiresAt);
    expect(await registry.secretRequest("acme", token, "p-dev")).toBe("expired");
    expect(await registry.fulfilSecretRequest("acme", token, "p-dev", VALUE)).toBe("expired");
    expect(await registry.secretNames(toolId, "production")).toEqual([]);
  });

  it("is refused to another person, who learns nothing, and stays valid for the right one", async () => {
    const { token } = await open();
    expect(await registry.secretRequest("acme", token, "p-other")).toBe("unknown");
    expect(await registry.fulfilSecretRequest("acme", token, "p-other", VALUE)).toBe("unknown");
    expect(await registry.secretNames(toolId, "production")).toEqual([]);
    expect(await registry.fulfilSecretRequest("acme", token, "p-dev", VALUE)).toMatchObject({
      name: "ODOO_KEY",
    });
  });

  it("is refused for a token that was never issued", async () => {
    expect(await registry.fulfilSecretRequest("acme", "nope", "p-dev", VALUE)).toBe("unknown");
  });

  it("does not spend the link when the registry cannot seal", async () => {
    const { token } = await open();
    const keyless = createRegistry(d1, { now: () => new Date(clock) });
    await expect(keyless.fulfilSecretRequest("acme", token, "p-dev", VALUE)).rejects.toThrow(
      /secret key/,
    );
    expect(await registry.secretRequest("acme", token, "p-dev")).toMatchObject({
      name: "ODOO_KEY",
    });
  });

  it("is refused on another workspace", async () => {
    const { token } = await open();
    expect(await registry.secretRequest("beta", token, "p-dev")).toBe("unknown");
    expect(await registry.fulfilSecretRequest("beta", token, "p-dev", VALUE)).toBe("unknown");
  });

  it("gives each link its own token", async () => {
    const [a, b] = [await open(), await open()];
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(43);
  });
});
