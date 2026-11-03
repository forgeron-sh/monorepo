import { ChangelogRefusal, type Build, type D1Database, type Hosting } from "@forgeron/hosting";
import { Miniflare } from "miniflare";
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

let mf: Miniflare;
let registry: Registry;
let tool: Tool;
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
  tool = await registry.createTool({ workspace: "acme", name: "crm" });
});
afterEach(() => mf.dispose());

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
  environment: "pilot" | "production" | "preview",
  fingerprint: string,
  version: string,
  extra: { group?: string; branch?: string; changelog?: false } = {},
) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(extra.branch ? { branch: extra.branch } : {}),
    ...(extra.group ? { group: extra.group } : {}),
    build: build(fingerprint, extra.changelog === false ? { changelog: undefined } : {}),
    version,
    actor: "ely",
  });

describe("promoteVersion", () => {
  it("puts an existing version on another environment from the recorded code, without a rebuild", async () => {
    const { hosting, uploaded } = fakeHosting();
    await deployTo(hosting, "pilot", "fp1", "1.0.0", { group: "beta" });
    const promoted = await promoteVersion(registry, hosting, {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "sam",
    });

    expect(uploaded.map((u) => [u.environment, u.build.fingerprint, u.build.worker])).toEqual([
      ["pilot", "fp1", "// fp1"],
      ["production", "fp1", "// fp1"],
    ]);
    expect(uploaded[1]!.build.migrations).toHaveLength(1);
    expect(promoted.environment.versionId).toBe(promoted.version.id);
    expect(await registry.listVersions(tool.id)).toHaveLength(1);
  });

  it("is recorded in the audit log with who did it", async () => {
    const { hosting } = fakeHosting();
    await deployTo(hosting, "pilot", "fp1", "1.0.0");
    const { environment } = await promoteVersion(registry, hosting, {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "sam",
    });
    expect((await registry.history(environment.id)).map((h) => [h.kind, h.actor])).toEqual([
      ["promote", "sam"],
    ]);
    const [pilot] = (await registry.listEnvironments(tool.id)).filter((e) => e.name === "pilot");
    expect((await registry.history(pilot!.id)).map((h) => [h.kind, h.actor])).toEqual([
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

  it("sets the pilot group", async () => {
    const { hosting } = fakeHosting();
    await deployTo(hosting, "production", "fp1", "1.0.0");
    const { environment } = await promoteVersion(registry, hosting, {
      tool,
      version: "1.0.0",
      to: "pilot",
      group: "beta",
      actor: "sam",
    });
    expect(environment.pilotGroup).toBe("beta");
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

describe("the pilot group at the production address", () => {
  it("gets the pilot version; everyone else gets production", async () => {
    const { hosting } = fakeHosting();
    const prod = await deployTo(hosting, "production", "fp1", "1.0.0");
    const pilot = await deployTo(hosting, "pilot", "fp2", "1.1.0", { group: "beta" });

    expect((await registry.servedFor(tool.id, ["beta"]))?.versionId).toBe(pilot.version.id);
    expect((await registry.servedFor(tool.id, ["beta", "ops"]))?.name).toBe("pilot");
    expect((await registry.servedFor(tool.id, ["ops"]))?.versionId).toBe(prod.version.id);
    expect((await registry.servedFor(tool.id, []))?.name).toBe("production");

    await registry.setPilotGroup(pilot.environment.id, undefined);
    expect((await registry.servedFor(tool.id, ["beta"]))?.name).toBe("production");
  });

  it("serves production when the pilot has no version yet", async () => {
    const { hosting } = fakeHosting();
    await deployTo(hosting, "production", "fp1", "1.0.0");
    const pilot = await registry.ensureEnvironment(tool.id, "pilot");
    await registry.setPilotGroup(pilot.id, "beta");
    expect((await registry.servedFor(tool.id, ["beta"]))?.name).toBe("production");
  });
});
