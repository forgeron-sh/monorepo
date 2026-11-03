import type { Build, Hosting } from "@forgeron/hosting";
import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database } from "@forgeron/hosting";
import { closePreview, createRegistry, deployBuild, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let mf: Miniflare;
let registry: Registry;
beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  const d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
});
afterEach(() => mf.dispose());

const build = (fingerprint: string): Build => ({
  manifest: { resources: {} } as unknown as Build["manifest"],
  worker: "export default {}",
  fingerprint,
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
});

function fakeHosting(failMigrate = false) {
  const calls: string[] = [];
  const hosting: Hosting = {
    async provision(environment) {
      calls.push("provision");
      return { environment, bindings: [] };
    },
    async upload(provisioned, b) {
      calls.push("upload");
      return { provisioned, build: b };
    },
    async migrate() {
      calls.push("migrate");
      if (failMigrate) throw new Error("migration failed");
      return { applied: [] };
    },
    async activate({ provisioned }) {
      calls.push("activate");
      return { url: `https://${provisioned.environment.name}.test` };
    },
    async teardown(environment) {
      calls.push(`teardown ${environment.branch ?? environment.name}`);
    },
  };
  return { hosting, calls };
}

describe("deployBuild", () => {
  it("records the build and version, and what the environment now serves", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    const { hosting, calls } = fakeHosting();
    const result = await deployBuild(registry, hosting, {
      tool,
      environment: "production",
      build: build("fp1"),
      version: "1.0.0",
      actor: "ely",
    });
    expect(calls).toEqual(["provision", "upload", "migrate", "activate"]);
    expect(result.environment).toMatchObject({
      versionId: result.version.id,
      url: "https://production.test",
    });
    expect((await registry.listVersions(tool.id)).map((v) => v.version)).toEqual(["1.0.0"]);
  });

  it("keeps the environment on its previous version when the deployment fails", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    const first = await deployBuild(registry, fakeHosting().hosting, {
      tool,
      environment: "production",
      build: build("fp1"),
      version: "1.0.0",
      actor: "ely",
    });
    await expect(
      deployBuild(registry, fakeHosting(true).hosting, {
        tool,
        environment: "production",
        build: build("fp2"),
        version: "1.1.0",
        actor: "ely",
      }),
    ).rejects.toThrow("migration failed");
    const [environment] = await registry.listEnvironments(tool.id);
    expect(environment?.versionId).toBe(first.version.id);
  });

  it("closes a preview: torn down, then forgotten", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    const { hosting, calls } = fakeHosting();
    await deployBuild(registry, hosting, {
      tool,
      environment: "preview",
      branch: "feat/a",
      build: build("fp1"),
      version: "0.0.1-a",
      actor: "ely",
    });
    await closePreview(registry, hosting, tool, "feat/a");
    expect(calls.at(-1)).toBe("teardown feat/a");
    expect(await registry.listEnvironments(tool.id)).toEqual([]);
  });
});
