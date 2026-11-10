import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { platformCaller } from "../platform/test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let caller: { developer: boolean; admin: boolean; roles?: string[] } | undefined;

const call = (path = "/api/tools/crm/manifest", method = "GET") =>
  platformCaller({ registry, who: () => caller })(
    new Request(`https://acme.forgeron.test${path}`, { method }),
  );

beforeEach(async () => {
  caller = { developer: true, admin: false };
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
});
afterEach(() => memory.close());

async function publish(name: string, version: string, manifest: object) {
  const tool =
    (await registry.findTool("acme", name)) ??
    (await registry.createTool({ workspace: "acme", name }));
  const build = await registry.recordBuild(tool.id, { fingerprint: `fp-${version}`, manifest });
  await registry.publishVersion(tool.id, build.id, version);
}

describe("manifest API", () => {
  it("answers the manifest of the latest version while production serves none", async () => {
    await publish("crm", "1.0.0", { name: "crm", version: "1.0.0" });
    await publish("crm", "1.1.0", { name: "crm", version: "1.1.0" });
    const response = await call();
    expect(response?.status).toBe(200);
    expect(await response!.json()).toEqual({ manifest: { name: "crm", version: "1.1.0" } });
  });

  it("answers the version production serves", async () => {
    await publish("crm", "1.0.0", { name: "crm", version: "1.0.0" });
    await publish("crm", "1.1.0", { name: "crm", version: "1.1.0" });
    const tool = (await registry.findTool("acme", "crm"))!;
    const first = (await registry.listVersions(tool.id)).find((v) => v.version === "1.0.0")!;
    const production = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(production.id, first.id, { actor: "test" });
    expect(await (await call())!.json()).toEqual({
      manifest: { name: "crm", version: "1.0.0" },
    });
  });

  it("is for developers and admins", async () => {
    await publish("crm", "1.0.0", { name: "crm" });
    caller = { developer: false, admin: false };
    expect((await call())?.status).toBe(403);
    caller = { developer: false, admin: true };
    expect((await call())?.status).toBe(200);
    caller = undefined;
    expect((await call())?.status).toBe(401);
  });

  it("says so when the tool has no version, refuses an unknown tool and other methods", async () => {
    await registry.createTool({ workspace: "acme", name: "empty" });
    const none = await call("/api/tools/empty/manifest");
    expect(none?.status).toBe(404);
    expect(((await none!.json()) as { error: string }).error).toBe("NO_MANIFEST");
    expect((await call("/api/tools/nope/manifest"))?.status).toBe(404);
    expect((await call("/api/tools/crm/manifest", "PUT"))?.status).toBe(405);
    expect(await call("/api/tools/crm/other")).toBeUndefined();
  });
});

describe("a branch's page (D-120)", () => {
  const manifest = (version: string) => ({
    name: "crm",
    version,
    interfaces: { mcp: true, api: false, cli: false, web: false },
    roles: {},
    actions: {},
    views: {},
    jobs: {},
    events: {},
    resources: {},
    uses: {},
  });
  async function withPreview() {
    await publish("crm", "1.0.0", manifest("1.0.0"));
    await publish("crm", "1.1.0-pilot", manifest("1.1.0-pilot"));
    const tool = (await registry.findTool("acme", "crm"))!;
    const [first, second] = await registry.listVersions(tool.id);
    const production = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(production.id, first!.id, { actor: "test" });
    const preview = await registry.ensureEnvironment(tool.id, "preview", "feat/pilot");
    await registry.activate(preview.id, second!.id, { actor: "test" });
  }
  const branch = encodeURIComponent("feat/pilot");

  it("answers the manifest the branch's preview serves, and 404 for a branch without one", async () => {
    await withPreview();
    const res = await call(`/api/tools/crm/manifest?branch=${branch}`);
    expect(res?.status).toBe(200);
    expect(((await res!.json()) as { manifest: { version: string } }).manifest.version).toBe(
      "1.1.0-pilot",
    );
    const none = await call("/api/tools/crm/manifest?branch=nope");
    expect(none?.status).toBe(404);
    expect(((await none!.json()) as { error: string }).error).toBe("NO_MANIFEST");
  });

  it("answers the branch's card to the team only, with the preview's address", async () => {
    await withPreview();
    caller = { developer: true, admin: false, roles: [] };
    const card = await call(`/api/catalog/crm?branch=${branch}`);
    expect(card?.status).toBe(200);
    expect(await card!.json()).toMatchObject({
      productionVersion: "1.1.0-pilot",
      connect: { mcp: { url: `https://acme.forgeron.test/t/crm@${branch}/mcp` } },
    });
    expect((await call("/api/catalog/crm?branch=nope"))?.status).toBe(404);
    caller = { developer: false, admin: false, roles: [] };
    expect((await call(`/api/catalog/crm?branch=${branch}`))?.status).toBe(403);
    expect((await call(`/api/catalog/crm/assets/x.png?branch=${branch}`))?.status).toBe(403);
    const production = await call("/api/catalog/crm");
    expect(await production!.json()).toMatchObject({ productionVersion: "1.0.0" });
  });
});
