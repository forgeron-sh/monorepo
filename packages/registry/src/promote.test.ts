import { ChangelogRefusal, type Build, type D1Database, type Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  deployBuild,
  migratePlatform,
  promoteVersion,
  rollbackEnvironment,
  type Registry,
  type Tool,
} from "./index";

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

const build = (fingerprint: string, extra: Partial<Build> = {}): Build => ({
  manifest: { resources: {} } as unknown as Build["manifest"],
  worker: `// ${fingerprint}`,
  fingerprint,
  migrations: [{ name: "0001", fingerprint: "m1", up: [], down: [], destructive: false }],
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
  ...extra,
});

function fakeHosting() {
  const calls: string[] = [];
  const uploaded: { environment: string; build: Build }[] = [];
  const hosting: Hosting = {
    async provision(environment) {
      calls.push("provision");
      return { environment, bindings: [] };
    },
    async upload(provisioned, b) {
      calls.push("upload");
      uploaded.push({ environment: provisioned.environment.name, build: b });
      return { provisioned, build: b };
    },
    async migrate() {
      calls.push("migrate");
      return { applied: [] };
    },
    async activate({ provisioned }) {
      calls.push("activate");
      return { url: `https://${provisioned.environment.name}.test` };
    },
    async teardown() {},
  };
  return { hosting, calls, uploaded };
}

const deployTo = (
  hosting: Hosting,
  environment: "production" | "preview",
  fingerprint: string,
  version: string,
  extra: { branch?: string; changelog?: false } = {},
) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(extra.branch ? { branch: extra.branch } : {}),
    build: build(fingerprint, extra.changelog === false ? { changelog: undefined } : {}),
    version,
    actor: "ely",
  });

describe("promoteVersion", () => {
  it("puts an existing version on another environment from the recorded code, without a rebuild", async () => {
    const { hosting, uploaded } = fakeHosting();
    await deployTo(hosting, "preview", "fp1", "1.0.0", { branch: "a" });
    const promoted = await promoteVersion(registry, hosting, {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "sam",
    });

    expect(uploaded.map((u) => [u.environment, u.build.fingerprint, u.build.worker])).toEqual([
      ["preview", "fp1", "// fp1"],
      ["production", "fp1", "// fp1"],
    ]);
    expect(uploaded[1]!.build.migrations).toHaveLength(1);
    expect(promoted.environment.versionId).toBe(promoted.version.id);
    expect(await registry.listVersions(tool.id)).toHaveLength(1);
  });

  it("is recorded in the audit log with who did it", async () => {
    const { hosting } = fakeHosting();
    await deployTo(hosting, "preview", "fp1", "1.0.0", { branch: "a" });
    const { environment } = await promoteVersion(registry, hosting, {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "sam",
    });
    expect((await registry.history(environment.id)).map((h) => [h.kind, h.actor])).toEqual([
      ["promote", "sam"],
    ]);
    const [preview] = (await registry.listEnvironments(tool.id)).filter(
      (e) => e.name === "preview",
    );
    expect((await registry.history(preview!.id)).map((h) => [h.kind, h.actor])).toEqual([
      ["deploy", "ely"],
    ]);
  });

  it("refuses an unknown version, a build without code, and a version the target refuses", async () => {
    const { hosting } = fakeHosting();
    await expect(
      promoteVersion(registry, hosting, { tool, version: "9.9.9", to: "production", actor: "sam" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const bare = await registry.recordBuild(tool.id, { fingerprint: "old", manifest: {} });
    await registry.publishVersion(tool.id, bare.id, "0.1.0");
    await expect(
      promoteVersion(registry, hosting, { tool, version: "0.1.0", to: "production", actor: "sam" }),
    ).rejects.toMatchObject({ code: "NO_ARTIFACT" });

    await deployTo(hosting, "preview", "fp2", "1.1.0-preview", { branch: "a", changelog: false });
    await expect(
      promoteVersion(registry, hosting, {
        tool,
        version: "1.1.0-preview",
        to: "production",
        actor: "sam",
      }),
    ).rejects.toBeInstanceOf(ChangelogRefusal);
    const production = (await registry.listEnvironments(tool.id)).find(
      (e) => e.name === "production",
    );
    expect(production?.versionId).toBeUndefined();
  });
});

describe("rollbackEnvironment", () => {
  it("puts the previous version back on traffic, without migrating, and logs it", async () => {
    const first = fakeHosting();
    const v1 = await deployTo(first.hosting, "production", "fp1", "1.0.0");
    await deployTo(first.hosting, "production", "fp2", "1.1.0");

    const second = fakeHosting();
    const result = await rollbackEnvironment(registry, second.hosting, {
      tool,
      environment: "production",
      actor: "sam",
    });
    expect(result.version.id).toBe(v1.version.id);
    expect(result.environment.versionId).toBe(v1.version.id);
    expect(second.calls).toEqual(["provision", "upload", "activate"]);
    expect(second.uploaded[0]!.build.fingerprint).toBe("fp1");
    expect((await registry.history(result.environment.id)).map((h) => [h.kind, h.actor])).toEqual([
      ["deploy", "ely"],
      ["deploy", "ely"],
      ["rollback", "sam"],
    ]);
  });

  it("has nowhere to go back to on a first version", async () => {
    const { hosting } = fakeHosting();
    await deployTo(hosting, "production", "fp1", "1.0.0");
    await expect(
      rollbackEnvironment(registry, hosting, { tool, environment: "production", actor: "sam" }),
    ).rejects.toMatchObject({ code: "NO_PREVIOUS" });
  });
});
