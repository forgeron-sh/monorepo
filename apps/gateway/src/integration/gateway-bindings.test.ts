import type { D1Database } from "@forgeron/hosting";
import { migratePlatform, saveGatewayAssets, saveGatewayCode } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gatewayBindingsOf, type GatewayEnv } from "../gateway";

// D-032: the deploy path binds a tool Worker to the gateway by uploading a new version of the
// gateway itself, from the code `platform install` stored in the platform D1.

let memory: MemoryD1;
let requests: Array<{ method: string; path: string; body: Record<string, unknown> }>;
const code = "export default { fetch: () => new Response('gateway') };".repeat(1000);

const env = (extra: Record<string, unknown> = {}): GatewayEnv =>
  ({
    DB: memory as unknown as D1Database,
    BASE_DOMAIN: "forgeron.test",
    CLOUDFLARE_ACCOUNT_ID: "acct",
    CLOUDFLARE_API_TOKEN: "test-token",
    GATEWAY_WORKER: "forgeron-gateway",
    AUTH_SECRET: "x",
    ...extra,
  }) as GatewayEnv;

beforeEach(async () => {
  memory = await createMemoryD1();
  await migratePlatform(memory as unknown as D1Database);
  await saveGatewayCode(memory as unknown as D1Database, code);
  await saveGatewayAssets(memory as unknown as D1Database, [
    { path: "/index.html", hash: "a".repeat(32), size: 2, base64: "aGk=", type: "text/html" },
  ]);
  requests = [];
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(input)).pathname.replace(/^\/client\/v4\/accounts\/[^/]+/, "");
    requests.push({
      method: init?.method ?? "GET",
      path,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return Response.json({
      success: true,
      errors: [],
      result: path.endsWith("/assets-upload-session")
        ? { jwt: "session-jwt", buckets: [] }
        : { id: "version-9" },
    });
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  return memory.close();
});

const versionUpload = () =>
  requests.find((r) => r.path.endsWith("/versions"))!.body as {
    bindings: Array<Record<string, string>>;
    modules: Array<{ content_base64: string }>;
    keep_assets?: boolean;
    assets?: { jwt: string; config: unknown };
  };

describe("the gateway binding its tools", () => {
  it("uploads itself with every binding it holds carried over, plus the tool's", async () => {
    const bindings = gatewayBindingsOf(
      env({ ASSETS: { fetch() {} }, TOOL_ACME__HR__PRODUCTION: {} }),
    )!;
    expect(await bindings.bind("acme--crm--production")).toBe(true);
    expect(requests.find((r) => r.path.endsWith("/versions"))!.path).toBe(
      "/workers/workers/forgeron-gateway/versions",
    );
    const sent = versionUpload();
    expect(sent.bindings).toContainEqual({ type: "inherit", name: "AUTH_SECRET" });
    expect(sent.bindings).toContainEqual({ type: "inherit", name: "DB" });
    expect(sent.bindings).toContainEqual({ type: "inherit", name: "TOOL_ACME__HR__PRODUCTION" });
    expect(sent.bindings).toContainEqual({
      type: "service",
      name: "TOOL_ACME__CRM__PRODUCTION",
      service: "acme--crm--production",
    });
    expect(JSON.stringify(sent)).not.toContain("test-token");
    expect(atob(sent.modules[0]!.content_base64)).toBe(code);
    expect(sent).not.toHaveProperty("keep_assets");
    expect(sent.assets).toEqual({
      jwt: "session-jwt",
      config: { not_found_handling: "single-page-application", run_worker_first: true },
    });
    expect(sent.bindings).toContainEqual({ type: "assets", name: "ASSETS" });
    expect(requests.find((r) => r.path.endsWith("/assets-upload-session"))!.body).toEqual({
      manifest: { "/index.html": { hash: "a".repeat(32), size: 2 } },
    });
    expect(requests.at(-1)).toMatchObject({
      method: "POST",
      path: "/workers/scripts/forgeron-gateway/deployments",
    });
  });

  it("uploads nothing when the gateway already holds the binding", async () => {
    const bindings = gatewayBindingsOf(env({ TOOL_ACME__CRM__PRODUCTION: {} }))!;
    expect(await bindings.bind("acme--crm--production")).toBe(false);
    expect(requests).toEqual([]);
  });

  it("removes a binding it holds, and keeps the others", async () => {
    const bindings = gatewayBindingsOf(env({ TOOL_ACME__CRM__PRODUCTION: {} }))!;
    expect(await bindings.unbind("acme--crm--production")).toBe(true);
    const sent = versionUpload();
    expect(sent.bindings.some((b) => b.name === "TOOL_ACME__CRM__PRODUCTION")).toBe(false);
    expect(sent.bindings).toContainEqual({ type: "inherit", name: "DB" });
  });

  it("sends no assets when the gateway serves none", async () => {
    await gatewayBindingsOf(env())!.bind("acme--crm--production");
    expect(versionUpload()).not.toHaveProperty("assets");
    expect(requests.some((r) => r.path.includes("assets"))).toBe(false);
  });

  it("fails clearly, uploading nothing, when it serves assets but none are stored", async () => {
    await (memory as unknown as D1Database).prepare(`DELETE FROM "gateway_assets"`).all();
    await expect(
      gatewayBindingsOf(env({ ASSETS: { fetch() {} } }))!.bind("acme--crm--production"),
    ).rejects.toThrow(/platform install` again/);
    expect(requests).toEqual([]);
  });

  it("is off without its own name or an account to call", () => {
    expect(gatewayBindingsOf(env({ GATEWAY_WORKER: undefined }))).toBeUndefined();
    expect(gatewayBindingsOf(env({ CLOUDFLARE_API_TOKEN: undefined }))).toBeUndefined();
  });

  it("fails clearly, uploading nothing, when the platform D1 holds no gateway code", async () => {
    await (memory as unknown as D1Database).prepare(`DELETE FROM "gateway_code"`).all();
    await expect(gatewayBindingsOf(env())!.bind("acme--crm--production")).rejects.toThrow(
      /platform install/,
    );
    expect(requests).toEqual([]);
  });
});
