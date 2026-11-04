import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleManifest } from "./manifest";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let caller: { developer: boolean; admin: boolean } | undefined;

const call = (path = "/api/tools/crm/manifest", method = "GET") =>
  handleManifest(new Request(`https://acme.forgeron.test${path}`, { method }), {
    registry,
    workspace: "acme",
    caller: async () => caller,
  });

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
    expect(await call("/api/tools/crm/secrets-status")).toBeUndefined();
  });
});
