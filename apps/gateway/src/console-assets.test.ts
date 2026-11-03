import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildGateway } from "../scripts/build";

// FOR-122: the console, built by `apps/console`, loads its entry page from the gateway, in workerd,
// the way `forgeron platform install` deploys them: the gateway bundle with the build as assets.

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const here = dirname(fileURLToPath(import.meta.url));
let dir: string;
let mf: Miniflare;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "forgeron-console-"));
  const dist = join(dir, "dist");
  const build = spawnSync("bunx", ["vite", "build", "--outDir", dist], {
    cwd: join(here, "..", "..", "console"),
    encoding: "utf8",
  });
  if (build.status !== 0) throw new Error(`console build failed:\n${build.stdout}${build.stderr}`);

  const worker = await buildGateway(join(dir, "worker.js"));

  mf = new Miniflare({
    modules: true,
    script: await readFile(worker, "utf8"),
    // Miniflare's workerd refuses a date later than its own build.
    compatibilityDate: "2026-08-06",
    compatibilityFlags: ["nodejs_compat"],
    bindings: { BASE_DOMAIN: "forgeron.app" },
    d1Databases: { DB: "platform" },
    assets: {
      directory: dist,
      binding: "ASSETS",
      routerConfig: { has_user_worker: true, invoke_user_worker_ahead_of_assets: true },
      assetConfig: { not_found_handling: "single-page-application" },
    },
  });
});

afterAll(async () => {
  await mf?.dispose();
  await rm(dir, { recursive: true, force: true });
});

describe("the built console served by the gateway", () => {
  it("loads its entry page at the workspace origin, with the console's headers", async () => {
    const response = await mf.dispatchFetch("https://acme.forgeron.app/");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("<title>Forgeron console</title>");
    expect(response.headers.get("content-security-policy")).toContain("default-src");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("serves the build's script, and the entry page for a route of the console", async () => {
    const page = await (await mf.dispatchFetch("https://acme.forgeron.app/")).text();
    const script = /src="(\/assets\/[^"]+\.js)"/.exec(page)?.[1];
    expect(script).toBeDefined();
    const asset = await mf.dispatchFetch(`https://acme.forgeron.app${script}`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("content-type")).toContain("javascript");
    const route = await mf.dispatchFetch("https://acme.forgeron.app/tools");
    expect(route.status).toBe(200);
    expect(await route.text()).toContain("<title>Forgeron console</title>");
  });
});
