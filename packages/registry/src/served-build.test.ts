import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, deployBuild, migratePlatform, type Registry, type Tool } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let tool: Tool;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  tool = await registry.createTool({ workspace: "acme", name: "crm" });
});
afterEach(() => memory.close());

const manifest = {
  profiles: { viewer: { grants: ["read"] } },
  actions: { "deals.list": { access: "read" } },
  resources: {},
} as unknown as Build["manifest"];

const hosting: Hosting = {
  async provision(environment) {
    return { environment, bindings: [] };
  },
  async upload(provisioned, build) {
    return { provisioned, build };
  },
  async migrate() {
    return { applied: [] };
  },
  async activate() {
    return { url: "https://x.test" };
  },
  async teardown() {},
};

const publish = (environment: "production" | "preview", fingerprint: string, branch?: string) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(branch ? { branch } : {}),
    build: {
      manifest,
      worker: "// the code of the worker, large",
      views: { "views/pipeline.js": "// a page" },
      changelog: { entries: [{}], declared: "patch", detected: "patch" },
      fingerprint,
    },
    version: environment === "production" ? "1.0.0" : "0.0.1",
    actor: "ely",
  });

describe("the build an environment serves (D-143)", () => {
  it("is read in one go, without the Worker's code or the migrations", async () => {
    await publish("production", "fp-prod");
    const build = await registry.servedBuild(
      tool.id,
      { production: true },
      { omit: ["worker", "migrations"] },
    );
    expect(build?.manifest).toEqual(manifest);
    expect(build?.views).toEqual({ "views/pipeline.js": "// a page" });
    expect(build).not.toHaveProperty("worker");
    expect(build).not.toHaveProperty("migrations");
  });

  it("tells production from a branch's channel, and is undefined where nothing is deployed", async () => {
    await publish("production", "fp-prod");
    await publish("preview", "fp-prev", "feat-x");
    const prod = await registry.servedBuild(tool.id, { production: true });
    const prev = await registry.servedBuild(tool.id, { branch: "feat-x" });
    expect(prod?.fingerprint).toBe("fp-prod");
    expect(prev?.fingerprint).toBe("fp-prev");
    expect(await registry.servedBuild(tool.id, { branch: "other" })).toBeUndefined();
    expect(await registry.servedBuild(tool.id, { channel: "staging" })).toBeUndefined();
  });

  it("keeps the whole row when nothing is left out", async () => {
    await publish("production", "fp-prod");
    const whole = await registry.servedBuild(tool.id, { production: true });
    expect(whole?.worker).toBe("// the code of the worker, large");
    const version = (await registry.listVersions(tool.id)).at(-1)!;
    expect((await registry.getBuild(version.buildId))?.worker).toBeDefined();
    expect(
      await registry.getBuild(version.buildId, { omit: ["worker", "views"] }),
    ).not.toHaveProperty("worker");
  });

  it("gives the manifest of what production serves, else of the latest version", async () => {
    await expect(registry.currentManifest(tool.id)).rejects.toThrow(/no version/);
    await publish("preview", "fp-prev", "feat-x");
    // Nothing in production yet: the latest version published stands in.
    expect(await registry.currentManifest(tool.id)).toEqual(manifest);
    await publish("production", "fp-prod");
    expect(await registry.currentManifest(tool.id)).toEqual(manifest);
  });
});
