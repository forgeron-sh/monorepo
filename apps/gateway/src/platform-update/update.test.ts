import { platformMigrations } from "@forgeron/registry";
import {
  createRegistry,
  loadGatewayAssets,
  loadGatewayCode,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import type { BuildMigration, D1Database } from "@forgeron/hosting";
import { FakeCloudflare } from "@forgeron/hosting/testing/fake-cloudflare";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayEnv } from "../env";
import { gatewayBindingsOf } from "../env";
import { simulatedGithub } from "../github/simulated-github";
import { restoreCommand, createPlatformUpdates, type PlatformUpdate } from "./update";
import { MAX_ARTIFACT_BYTES } from "./artifact";
import { compareVersions, versionOfTag } from "./version";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The platform updating itself (D-138), against a simulated GitHub (the release and its files) and a
// simulated Cloudflare (the restore point, the new version, the deployment), on a real D1.

const REPO = "forgeron-sh/monorepo";
const WORKER_CODE = "export default { fetch: () => new Response('gateway 0.6.0') };";
const next: BuildMigration = {
  name: "0099_next_release",
  fingerprint: "next-release-v1",
  destructive: false,
  up: [{ sql: `CREATE TABLE "next_release" ("id" TEXT PRIMARY KEY NOT NULL)`, parameters: [] }],
  down: [],
};

const sha256 = async (bytes: Uint8Array | string) => {
  const data = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/** The artifact `scripts/platform-artifact.ts` writes, for `version`. */
const artifactOf = (version: string, patch: Record<string, unknown> = {}) =>
  JSON.stringify({
    format: 1,
    version,
    commit: "c0ffee0123456789",
    worker: btoa(WORKER_CODE),
    assets: [
      {
        path: "/index.html",
        hash: "b".repeat(32),
        size: 6,
        base64: btoa("<html>"),
        type: "text/html",
      },
      {
        path: "/app.js",
        hash: "c".repeat(32),
        size: 2,
        base64: btoa("1;"),
        type: "text/javascript",
      },
    ],
    migrations: [...platformMigrations, next],
    ...patch,
  });

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let clock: Date;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => clock });
  clock = new Date("2026-11-13T10:00:00Z");
});
afterEach(() => memory.close());

interface Options {
  env?: Partial<GatewayEnv>;
  current?: string;
  /** Releases to add: tag, and the files (by default the artifact of that version and its checksum). */
  releases?: {
    tag: string;
    draft?: boolean;
    prerelease?: boolean;
    files?: false | Record<string, string>;
  }[];
  defer?: (work: Promise<unknown>) => void;
}

async function setup(options: Options = {}) {
  const github = await simulatedGithub({ now: () => clock });
  const cloudflare = new FakeCloudflare();
  const platformId = "db-platform";
  cloudflare.databases.set(platformId, { name: "forgeron-platform", d1 });
  const env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.test",
    CLOUDFLARE_ACCOUNT_ID: "acct",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    GATEWAY_WORKER: "forgeron-gateway",
    PLATFORM_D1_ID: platformId,
    AUTH_SECRET: "x",
    ASSETS: { fetch() {} },
    TOOL_ACME__CRM__PRODUCTION: {},
    ...options.env,
  } as GatewayEnv;
  // The gateway as `platform install` left it: a version holding every binding, deployed.
  cloudflare.workers.set("forgeron-gateway", {
    versions: [
      {
        id: "version-0",
        body: {
          modules: [{ content_base64: "" }],
          bindings: Object.keys(env).map((name) => ({ type: "plain_text", name, text: "kept" })),
        },
      },
    ],
    deployed: "version-0",
  });
  for (const release of options.releases ?? [{ tag: "v0.6.0" }]) {
    const version = release.tag.slice(1);
    const body = artifactOf(version);
    github.addRelease(REPO, {
      tag: release.tag,
      body: `Notes of ${release.tag}`,
      draft: release.draft ?? false,
      prerelease: release.prerelease ?? false,
      files:
        release.files === false
          ? {}
          : (release.files ?? {
              "forgeron-platform.json": body,
              "forgeron-platform.json.sha256": `${await sha256(body)}  forgeron-platform.json\n`,
            }),
    });
  }
  // What the platform reached, in order: the bookmark is asked for before a migration is applied.
  const events: string[] = [];
  const network: typeof fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string" || input instanceof URL ? String(input) : input.url,
    );
    if (url.hostname === "api.cloudflare.com") {
      if (url.pathname.endsWith("/time_travel/bookmark")) {
        const { results } = await d1
          .prepare(`SELECT COUNT(*) AS n FROM "_forgeron_migrations"`)
          .all();
        events.push(`bookmark after ${((results ?? [])[0] as { n: number }).n} migrations`);
      }
      return cloudflare.fetch(input, init);
    }
    return github.fetch(input, init);
  };
  const deferred: Promise<unknown>[] = [];
  const updates = createPlatformUpdates({
    env,
    fetch: () => network,
    now: () => clock,
    ...(options.defer ? { defer: options.defer } : {}),
    current: { version: options.current ?? "0.5.0", commit: "abc123" },
    gateway: (fetcher) => gatewayBindingsOf(env, { fetch: fetcher }),
  });
  const update: PlatformUpdate = updates.of(registry);
  return { github, cloudflare, env, events, network, update, updates, deferred, platformId };
}

const applied = async () =>
  (
    (await d1.prepare(`SELECT "name" FROM "_forgeron_migrations" ORDER BY "name"`).all())
      .results as {
      name: string;
    }[]
  ).map((r) => r.name);

describe("versions", () => {
  it("reads a release tag, and compares numbers, not strings", () => {
    expect(versionOfTag("v0.10.0")).toBe("0.10.0");
    expect(versionOfTag("0.10.0")).toBeUndefined();
    expect(versionOfTag("v1.2.3-rc.1")).toBeUndefined();
    expect(versionOfTag("gateway-v1.2.3")).toBeUndefined();
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("0.5.0", "0.5.0")).toBe(0);
    expect(compareVersions("0.0.0", "0.1.0")).toBeLessThan(0);
  });
});

describe("what is newer", () => {
  it("says a newer release is available, with its notes, link and the migrations it brings", async () => {
    const { update, github } = await setup();
    const state = await update.state();
    expect(state).toMatchObject({
      current: { version: "0.5.0", commit: "abc123" },
      latest: {
        version: "0.6.0",
        url: `https://github.com/${REPO}/releases/tag/v0.6.0`,
        notes: "Notes of v0.6.0",
        publishedAt: "2026-11-13T10:00:00.000Z",
      },
      available: true,
      pending: { migrations: ["0099_next_release"] },
    });
    expect(state.blocked).toBeUndefined();
    expect(state.running).toBeUndefined();
    // No token ever goes to GitHub.
    expect(github.state.releaseAuthorizations.length).toBeGreaterThan(0);
    expect(github.state.releaseAuthorizations.every((a) => a === null)).toBe(true);
  });

  it("is up to date on the latest release, and ahead of an older one", async () => {
    const same = await setup({ current: "0.6.0" });
    expect(await same.update.state()).toMatchObject({
      available: false,
      latest: { version: "0.6.0" },
    });
    const ahead = await setup({ current: "0.7.0" });
    expect((await ahead.update.state()).available).toBe(false);
  });

  it("takes the highest version, not the newest tag, and no draft, prerelease or other tag", async () => {
    const { update } = await setup({
      releases: [
        { tag: "v0.9.0" },
        { tag: "v0.10.0" },
        { tag: "v0.11.0", draft: true },
        { tag: "v0.12.0", prerelease: true },
        { tag: "gateway-v0.20.0" },
        { tag: "v0.8.0" },
      ],
    });
    expect((await update.state()).latest?.version).toBe("0.10.0");
  });

  it("keeps GitHub's answer ten minutes, and asks again after", async () => {
    const { update, github } = await setup();
    const asked = () => github.state.calls.filter((c) => c.endsWith("/releases")).length;
    await update.state();
    await update.state();
    expect(asked()).toBe(1);
    clock = new Date(clock.getTime() + 9 * 60_000);
    await update.state();
    expect(asked()).toBe(1);
    clock = new Date(clock.getTime() + 2 * 60_000);
    await update.state();
    expect(asked()).toBe(2);
  });

  it("says why when GitHub fails or the repository has no release, and never throws", async () => {
    const down = await setup();
    down.github.state.releases.clear();
    expect(await down.update.state()).toMatchObject({
      available: false,
      blocked: { code: "RELEASES_UNAVAILABLE" },
    });
    expect((await down.update.state()).latest).toBeUndefined();

    const none = await setup({ releases: [] });
    none.github.addRelease(REPO, { tag: "v1.0.0-beta", prerelease: true });
    expect((await none.update.state()).blocked).toMatchObject({ code: "RELEASES_UNAVAILABLE" });

    const unreachable = await setup();
    const broken = createPlatformUpdates({
      env: unreachable.env,
      fetch: () => async () => {
        throw new Error("offline");
      },
      now: () => clock,
      current: { version: "0.5.0" },
    }).of(registry);
    expect(await broken.state()).toMatchObject({ blocked: { code: "RELEASES_UNAVAILABLE" } });
  });

  it("blocks a release that carries no artifact, or an artifact that cannot be read", async () => {
    const bare = await setup({ releases: [{ tag: "v0.6.0", files: false }] });
    expect(await bare.update.state()).toMatchObject({
      available: true,
      blocked: { code: "NO_ARTIFACT" },
    });
    const bad = await setup({
      releases: [
        {
          tag: "v0.6.0",
          files: {
            "forgeron-platform.json": "{}",
            "forgeron-platform.json.sha256": `${"0".repeat(64)}  forgeron-platform.json`,
          },
        },
      ],
    });
    const state = await bad.update.state();
    expect(state.blocked).toMatchObject({ code: "NO_ARTIFACT" });
    expect(state.blocked?.message).toMatch(/checksum/);
  });

  it.each([
    ["SELF_UPDATE=off", { SELF_UPDATE: "off" }, "OFF"],
    ["no PLATFORM_D1_ID", { PLATFORM_D1_ID: undefined }, "NO_DATABASE_ID"],
    ["the cloud's base domain", { BASE_DOMAIN: "acme.forgeron.app" }, "CLOUD"],
    ["the cloud's dispatch namespace", { DISPATCHER: {} }, "CLOUD"],
    ["a gateway that did not install itself", { GATEWAY_WORKER: undefined }, "NOT_SELF_HOST"],
    ["no Cloudflare token", { CLOUDFLARE_API_TOKEN: undefined }, "NO_CREDENTIALS"],
  ])("is blocked, and asks GitHub nothing, with %s", async (_name, env, code) => {
    const { update, github } = await setup({ env: env as Partial<GatewayEnv> });
    const state = await update.state();
    expect(state.blocked?.code).toBe(code);
    expect(state.blocked?.message.length).toBeGreaterThan(10);
    expect(state.available).toBe(false);
    expect(github.state.calls).toEqual([]);
    expect(await update.start("0.6.0", "p1")).toMatchObject({
      status: "blocked",
      blocked: { code },
    });
    expect(await applied()).not.toContain("0099_next_release");
  });

  it("names a missing database id in plain words", async () => {
    const { update } = await setup({ env: { PLATFORM_D1_ID: undefined } });
    expect((await update.state()).blocked?.message).toBe(
      "Run `forgeron platform install` once more: this install does not know its database id yet.",
    );
  });
});

describe("updating", () => {
  it("does everything in the decided order, and deploys the new version at 100 %", async () => {
    const { update, cloudflare, events, env, platformId } = await setup();
    const before = (await applied()).length;
    const started = await update.start("0.6.0", "p1");
    expect(started.status).toBe("started");
    const id = started.status === "started" ? started.run.id : "";

    // The restore point is taken before the first migration is applied.
    expect(events).toEqual([`bookmark after ${before} migrations`]);
    expect(cloudflare.bookmarks).toEqual([{ database: platformId, bookmark: "00000001-bookmark" }]);
    expect(await applied()).toContain("0099_next_release");

    // The new code and console are kept in the platform D1.
    expect(await loadGatewayCode(d1)).toBe(WORKER_CODE);
    expect((await loadGatewayAssets(d1))?.map((a) => a.path)).toEqual(["/app.js", "/index.html"]);

    // A new version of the gateway, every binding inherited (the tools' included), deployed at 100 %.
    const worker = cloudflare.workers.get("forgeron-gateway")!;
    expect(worker.versions).toHaveLength(2);
    expect(worker.deployed).toBe(worker.versions.at(-1)!.id);
    const sent = cloudflare.uploads.at(-1)!;
    expect(atob(sent.modules[0]!.content_base64)).toBe(WORKER_CODE);
    const inherited = sent.bindings.filter((b) => b.type === "inherit").map((b) => b.name);
    expect(inherited).toEqual(
      expect.arrayContaining(["DB", "AUTH_SECRET", "PLATFORM_D1_ID", "TOOL_ACME__CRM__PRODUCTION"]),
    );
    expect(inherited).not.toContain("ASSETS");
    expect(sent.bindings).toContainEqual({ type: "assets", name: "ASSETS" });
    expect(sent.assets?.jwt).toBeTruthy();
    expect(JSON.stringify(sent)).not.toContain("cf-test-token");
    expect(cloudflare.calls.at(-1)).toBe("POST /workers/scripts/forgeron-gateway/deployments");
    expect(Object.keys(env)).toContain("TOOL_ACME__CRM__PRODUCTION");

    // The run, every step done.
    const run = await update.run(id);
    expect(run).toMatchObject({
      from: "0.5.0",
      to: "0.6.0",
      state: "succeeded",
      bookmark: "00000001-bookmark",
    });
    expect(run?.steps.map((s) => [s.name, s.state])).toEqual([
      ["download", "done"],
      ["restore-point", "done"],
      ["migrate", "done"],
      ["code", "done"],
      ["deploy", "done"],
    ]);
    expect(run?.steps[2]?.message).toContain("0099_next_release");
    expect(run?.restoreCommand).toBeUndefined();

    // Audited: from, to, the restore point and the result.
    const { results } = await d1
      .prepare(`SELECT * FROM "audit_log" WHERE "subject" = 'platform:update'`)
      .all();
    expect(results).toHaveLength(1);
    expect(results?.[0]).toMatchObject({ actor: "p1", result: "ok" });
    expect(JSON.parse(String(((results ?? [])[0] as { detail: string }).detail))).toMatchObject({
      from: "0.5.0",
      to: "0.6.0",
      bookmark: "00000001-bookmark",
      result: "succeeded",
    });
  });

  it("answers at once and goes on after the answer when it is given a way to", async () => {
    const work: Promise<unknown>[] = [];
    const { update } = await setup({ defer: (w) => work.push(w) });
    const started = await update.start("0.6.0", "p1");
    expect(started).toMatchObject({ status: "started", run: { state: "running" } });
    expect(await applied()).not.toContain("0099_next_release");
    // While it runs: it is what the state says, and a second one is refused.
    expect(await update.state()).toMatchObject({ running: { to: "0.6.0" } });
    expect(await update.start("0.7.0", "p2")).toEqual({ status: "running" });
    await Promise.all(work);
    expect(await applied()).toContain("0099_next_release");
    const state = await update.state();
    expect(state.running).toBeUndefined();
    expect((await registry.listUpdateRuns()).map((r) => r.state)).toEqual(["succeeded"]);
  });

  it("refuses the same version and a downgrade, and records no run", async () => {
    const { update } = await setup({ current: "0.6.0" });
    expect(await update.start("0.6.0", "p1")).toEqual({ status: "not-newer", current: "0.6.0" });
    expect(await update.start("0.5.9", "p1")).toEqual({ status: "not-newer", current: "0.6.0" });
    expect(await update.start("0.10.0", "p1")).toMatchObject({ status: "started" });
    expect(await registry.listUpdateRuns()).toHaveLength(1);
  });

  it("refuses an artifact whose hash is not the release's, before anything changes", async () => {
    const body = artifactOf("0.6.0");
    const { update, cloudflare } = await setup({
      releases: [
        {
          tag: "v0.6.0",
          files: {
            "forgeron-platform.json": body,
            "forgeron-platform.json.sha256": `${await sha256("something else")}  forgeron-platform.json\n`,
          },
        },
      ],
    });
    const started = await update.start("0.6.0", "p1");
    const run = await update.run(started.status === "started" ? started.run.id : "");
    expect(run?.state).toBe("failed");
    expect(run?.steps[0]).toMatchObject({ name: "download", state: "failed" });
    expect(run?.steps[0]?.message).toMatch(/checksum/);
    expect(run?.steps.slice(1).every((s) => s.state === "pending")).toBe(true);
    expect(run?.restoreCommand).toBeUndefined();
    expect(cloudflare.bookmarks).toEqual([]);
    expect(cloudflare.workers.get("forgeron-gateway")!.versions).toHaveLength(1);
    expect(await applied()).not.toContain("0099_next_release");
    expect(await loadGatewayCode(d1)).toBeUndefined();
  });

  it.each([
    ["another format", { format: 2 }, /format 2/],
    ["another version than the one asked", { version: "0.7.0" }, /0\.7\.0, not the 0\.6\.0/],
    ["no gateway code", { worker: "" }, /shape/],
    ["a migration list that is not one", { migrations: "x" }, /shape/],
  ])("refuses an artifact with %s", async (_name, patch, message) => {
    const body = artifactOf("0.6.0", patch);
    const { update, cloudflare } = await setup({
      releases: [
        {
          tag: "v0.6.0",
          files: {
            "forgeron-platform.json": body,
            "forgeron-platform.json.sha256": `${await sha256(body)}  forgeron-platform.json\n`,
          },
        },
      ],
    });
    const started = await update.start("0.6.0", "p1");
    const run = await update.run(started.status === "started" ? started.run.id : "");
    expect(run?.steps[0]?.state).toBe("failed");
    expect(run?.steps[0]?.message).toMatch(message);
    expect(cloudflare.bookmarks).toEqual([]);
  });

  it("refuses an artifact over 20 MB", async () => {
    const big = new Uint8Array(MAX_ARTIFACT_BYTES + 1).fill(32);
    const { update, github, cloudflare } = await setup({ releases: [] });
    github.addRelease(REPO, {
      tag: "v0.6.0",
      files: {
        "forgeron-platform.json": big,
        "forgeron-platform.json.sha256": `${await sha256(big)}  forgeron-platform.json`,
      },
    });
    const started = await update.start("0.6.0", "p1");
    const run = await update.run(started.status === "started" ? started.run.id : "");
    expect(run?.steps[0]?.message).toMatch(/20 MB/);
    expect(cloudflare.bookmarks).toEqual([]);
  });

  it("refuses a release whose migrations this database cannot take, or that destroys data, before anything changes", async () => {
    const without = artifactOf("0.6.0", { migrations: platformMigrations.slice(1) });
    const destructive = artifactOf("0.6.0", {
      migrations: [...platformMigrations, { ...next, destructive: true }],
    });
    for (const [body, message] of [
      [without, /was applied, but this build does not have it/],
      [destructive, /drops or rewrites data/],
    ] as const) {
      const { update, cloudflare } = await setup({
        releases: [
          {
            tag: "v0.6.0",
            files: {
              "forgeron-platform.json": body,
              "forgeron-platform.json.sha256": `${await sha256(body)}  forgeron-platform.json`,
            },
          },
        ],
      });
      const started = await update.start("0.6.0", "p1");
      const run = await update.run(started.status === "started" ? started.run.id : "");
      expect(run?.steps[0]).toMatchObject({ state: "failed" });
      expect(run?.steps[0]?.message).toMatch(message);
      expect(cloudflare.bookmarks).toEqual([]);
    }
  });

  it("does not update without a restore point, and changes nothing", async () => {
    const { update, cloudflare, platformId } = await setup();
    cloudflare.noTimeTravel.add(platformId);
    const started = await update.start("0.6.0", "p1");
    const run = await update.run(started.status === "started" ? started.run.id : "");
    expect(run).toMatchObject({ state: "failed" });
    expect(run?.steps.map((s) => s.state)).toEqual([
      "done",
      "failed",
      "pending",
      "pending",
      "pending",
    ]);
    expect(run?.restoreCommand).toBeUndefined();
    expect(await applied()).not.toContain("0099_next_release");
    expect(cloudflare.workers.get("forgeron-gateway")!.versions).toHaveLength(1);
  });

  it("says what was done and how to restore when the deployment fails after the migrations", async () => {
    const { update, cloudflare, platformId } = await setup();
    // Cloudflare refuses the new version: the Worker is gone from the account.
    cloudflare.workers.delete("forgeron-gateway");
    const started = await update.start("0.6.0", "p1");
    const run = await update.run(started.status === "started" ? started.run.id : "");
    expect(run?.state).toBe("failed");
    expect(run?.steps.map((s) => s.state)).toEqual(["done", "done", "done", "done", "failed"]);
    expect(run?.error).toMatch(/restore/);
    expect(run?.restoreCommand).toBe(
      `wrangler d1 time-travel restore ${platformId} --bookmark 00000001-bookmark`,
    );
    expect(restoreCommand("db", "bm")).toBe("wrangler d1 time-travel restore db --bookmark bm");
    // The migrations did run, which is why the restore command is given.
    expect(await applied()).toContain("0099_next_release");
    // The failure is on record and in the audit log, and it is what the state says afterwards.
    const { results } = await d1
      .prepare(`SELECT "result", "detail" FROM "audit_log" WHERE "subject" = 'platform:update'`)
      .all();
    expect(results?.[0]).toMatchObject({ result: "error" });
    expect((await update.state()).lastFailed?.restoreCommand).toBe(run?.restoreCommand);
    // The next update can start.
    expect(await registry.findRunningUpdate()).toBeUndefined();
  });

  it("ends a run a stopped gateway left running, so that it does not block the next one", async () => {
    const { update } = await setup();
    await registry.startUpdateRun({ fromVersion: "0.5.0", toVersion: "0.6.0", actor: "p1" });
    expect(await update.start("0.6.0", "p2")).toEqual({ status: "running" });
    clock = new Date(clock.getTime() + 11 * 60_000);
    const state = await update.state();
    expect(state.running).toBeUndefined();
    expect(state.lastFailed?.error).toMatch(/interrupted/);
    expect(await update.start("0.6.0", "p2")).toMatchObject({ status: "started" });
  });
});
