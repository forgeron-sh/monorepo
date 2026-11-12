import { ChangelogRefusal, type Build, type D1Database, type Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  deployBuild,
  closeChannel,
  migratePlatform,
  putOnChannel,
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
  const uploaded: { environment: string; build: Build; channel?: string }[] = [];
  const removed: unknown[] = [];
  const hosting: Hosting = {
    async provision(environment) {
      calls.push("provision");
      return { environment, bindings: [] };
    },
    async upload(provisioned, b) {
      calls.push("upload");
      uploaded.push({
        environment: provisioned.environment.name,
        build: b,
        ...(provisioned.environment.channel ? { channel: provisioned.environment.channel } : {}),
      });
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
    async teardown(environment) {
      removed.push(environment);
    },
  };
  return { hosting, calls, uploaded, removed };
}

const deployTo = (
  hosting: Hosting,
  environment: "production" | "preview",
  fingerprint: string,
  version: string,
  extra: { branch?: string; changelog?: false | "pending" } = {},
) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(extra.branch ? { branch: extra.branch } : {}),
    build: build(
      fingerprint,
      extra.changelog === false
        ? { changelog: undefined }
        : extra.changelog === "pending"
          ? {
              changelog: { entries: [{}], declared: "patch", detected: "patch", released: false },
            }
          : {},
    ),
    version,
    actor: "ely",
  });

describe("putOnChannel", () => {
  it("puts a branch's release on production from the recorded code, without a rebuild", async () => {
    const { hosting, uploaded } = fakeHosting();
    await deployTo(hosting, "preview", "fp1", "1.0.0", { branch: "a" });
    const promoted = await putOnChannel(registry, hosting, {
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
    const { environment } = await putOnChannel(registry, hosting, {
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

  it("refuses an unknown version, a build without code, and a build that is not a release", async () => {
    const { hosting } = fakeHosting();
    await expect(
      putOnChannel(registry, hosting, { tool, version: "9.9.9", to: "production", actor: "sam" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const bare = await registry.recordBuild(tool.id, { fingerprint: "old", manifest: {} });
    await registry.publishVersion(tool.id, bare.id, "0.1.0");
    await expect(
      putOnChannel(registry, hosting, { tool, version: "0.1.0", to: "production", actor: "sam" }),
    ).rejects.toMatchObject({ code: "NO_ARTIFACT" });

    await deployTo(hosting, "preview", "fp2", "1.1.0-preview", { branch: "a", changelog: false });
    await expect(
      putOnChannel(registry, hosting, {
        tool,
        version: "1.1.0-preview",
        to: "production",
        actor: "sam",
      }),
    ).rejects.toBeInstanceOf(ChangelogRefusal);
    // Changes waiting in changes/ are entries, but not a release yet (D-125).
    await deployTo(hosting, "preview", "fp3", "1.1.0-pending", {
      branch: "a",
      changelog: "pending",
    });
    await expect(
      putOnChannel(registry, hosting, {
        tool,
        version: "1.1.0-pending",
        to: "production",
        actor: "sam",
      }),
    ).rejects.toMatchObject({ code: "NO_ENTRY" });
    const production = (await registry.listEnvironments(tool.id)).find(
      (e) => e.name === "production",
    );
    expect(production?.versionId).toBeUndefined();
  });

  it("takes a marketplace's publication as its release", async () => {
    const { hosting } = fakeHosting();
    await deployTo(hosting, "preview", "fp1", "1.0.0", { branch: "a", changelog: false });
    const done = await putOnChannel(registry, hosting, {
      tool,
      version: "1.0.0",
      to: "production",
      actor: "sam",
      published: true,
    });
    expect(done.environment.versionId).toBe(done.version.id);
  });
});

describe("permanent channels (D-125)", () => {
  it("are added by name, follow a branch, and refuse a name that is not one", async () => {
    const staging = await registry.addChannel({
      toolId: tool.id,
      name: "staging",
      follows: "staging",
      actor: "root",
    });
    expect(staging).toMatchObject({ name: "channel", channel: "staging", follows: "staging" });
    expect(staging.autoUpdate).toBe(false);
    for (const name of ["production", "preview", "Staging", "-x", "a".repeat(31)]) {
      await expect(
        registry.addChannel({ toolId: tool.id, name, follows: "main", actor: "root" }),
      ).rejects.toMatchObject({ code: "INVALID" });
    }
    await expect(
      registry.addChannel({ toolId: tool.id, name: "staging", follows: "main", actor: "root" }),
    ).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    const set = await registry.setChannel({
      toolId: tool.id,
      name: "staging",
      autoUpdate: true,
      actor: "root",
    });
    expect(set).toMatchObject({ follows: "staging", autoUpdate: true });
    expect((await registry.permanentChannels(tool.id)).map((c) => [c.name, c.follows])).toEqual([
      ["production", "main"],
      ["staging", "staging"],
    ]);
    const audit = await registry.listAudit(tool.id, { kind: "access" });
    expect(audit.map((a) => a.subject)).toEqual(["channel:staging", "channel:staging"]);
  });

  it("each has its own environment, apart from production's", async () => {
    const { hosting, uploaded } = fakeHosting();
    await registry.addChannel({ toolId: tool.id, name: "staging", follows: "staging", actor: "r" });
    await deployTo(hosting, "preview", "fp1", "1.0.0-preview.staging", { branch: "staging" });
    const done = await putOnChannel(registry, hosting, {
      tool,
      version: "1.0.0-preview.staging",
      to: "channel",
      channel: "staging",
      actor: "sam",
    });
    expect(done.environment).toMatchObject({ name: "channel", channel: "staging" });
    expect(uploaded.at(-1)).toMatchObject({ environment: "channel", channel: "staging" });
    const production = (await registry.listEnvironments(tool.id)).find(
      (e) => e.name === "production",
    );
    expect(production).toBeUndefined();
    await expect(
      putOnChannel(registry, hosting, {
        tool,
        version: "1.0.0-preview.staging",
        to: "channel",
        channel: "ghost",
        actor: "sam",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("offer the latest release of the branch they follow, never a build that is not one", async () => {
    const { hosting } = fakeHosting();
    await registry.addChannel({ toolId: tool.id, name: "staging", follows: "staging", actor: "r" });
    expect(await registry.availableUpdate(tool.id)).toBeUndefined();

    await deployTo(hosting, "preview", "fp1", "1.0.0", { branch: "main" });
    await deployTo(hosting, "preview", "fp2", "1.0.1-wip", { branch: "main", changelog: false });
    await deployTo(hosting, "preview", "fp3", "1.0.1-pending", {
      branch: "main",
      changelog: "pending",
    });
    await deployTo(hosting, "preview", "fp4", "2.0.0", { branch: "staging" });
    // The branch's preview serves a build that is not a release: production is offered 1.0.0.
    expect(await registry.availableUpdate(tool.id)).toEqual({ version: "1.0.0", branch: "main" });
    expect(await registry.availableUpdate(tool.id, "staging")).toEqual({
      version: "2.0.0",
      branch: "staging",
    });
    expect(await registry.availableUpdate(tool.id, "ghost")).toBeUndefined();

    await putOnChannel(registry, hosting, { tool, version: "1.0.0", to: "production", actor: "s" });
    expect(await registry.availableUpdate(tool.id)).toBeUndefined();
    expect((await registry.findVersion(tool.id, "1.0.0"))?.branch).toBe("main");
  });

  it("roll back to a release they served, and are removed with their Worker and database", async () => {
    const { hosting, removed } = fakeHosting();
    await registry.addChannel({ toolId: tool.id, name: "recette", follows: "main", actor: "r" });
    for (const [fp, version] of [
      ["fp1", "1.0.0"],
      ["fp2", "1.1.0"],
    ] as const) {
      await deployTo(hosting, "preview", fp, version, { branch: "main" });
      await putOnChannel(registry, hosting, {
        tool,
        version,
        to: "channel",
        channel: "recette",
        actor: "s",
      });
    }
    const back = await rollbackEnvironment(registry, hosting, {
      tool,
      environment: "channel",
      channel: "recette",
      actor: "sam",
    });
    expect(back.version.version).toBe("1.0.0");
    expect(back.environment).toMatchObject({ name: "channel", channel: "recette" });

    await closeChannel(registry, hosting, tool, "recette");
    expect(removed).toEqual([{ tool: "crm", name: "channel", channel: "recette" }]);
    expect(await registry.findChannel(tool.id, "recette")).toBeUndefined();
    await expect(closeChannel(registry, hosting, tool, "recette")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
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
