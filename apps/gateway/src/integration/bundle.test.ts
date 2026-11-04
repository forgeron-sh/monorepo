import { GATEWAY_COMPATIBILITY_DATE, GATEWAY_COMPATIBILITY_FLAGS } from "@forgeron/hosting";
import type { D1Database } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildGateway } from "../../scripts/build";

// `bun run --cwd apps/gateway build` (D-028): the bundle is one ES module that workerd loads with
// the compatibility settings `platform install` uploads it with, and it answers requests.

// The workerd pinned with Miniflare 4.20260730.0 refuses a date after 2026-08-06 ("the newest date
// supported by this server binary"), so the bundle is loaded with the older of the two. Bump it
// with Miniflare; the flags are the ones the install uses.
const WORKERD_NEWEST_DATE = "2026-08-06";

let dir: string;
let file: string;
let mf: Miniflare;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "forgeron-gateway-"));
  file = await buildGateway(join(dir, "worker.js"));
  mf = new Miniflare({
    modules: [{ type: "ESModule", path: "worker.js", contents: await readFile(file, "utf8") }],
    compatibilityDate:
      GATEWAY_COMPATIBILITY_DATE < WORKERD_NEWEST_DATE
        ? GATEWAY_COMPATIBILITY_DATE
        : WORKERD_NEWEST_DATE,
    compatibilityFlags: [...GATEWAY_COMPATIBILITY_FLAGS],
    d1Databases: { DB: "platform" },
    bindings: { BASE_DOMAIN: "forgeron.test" },
  });
  await migratePlatform((await mf.getD1Database("DB")) as unknown as D1Database);
}, 60_000);

afterAll(async () => {
  await mf?.dispose();
  await rm(dir, { recursive: true, force: true });
});

describe("gateway bundle", () => {
  it("is one module that imports nothing but the runtime's own node: modules", async () => {
    const code = await readFile(file, "utf8");
    const specifiers = [...code.matchAll(/^\s*import\b[^"']*["']([^"']+)["']/gm)].map((m) => m[1]!);
    expect(specifiers.filter((s) => !s.startsWith("node:"))).toEqual([]);
  });

  it("answers 404 for a host outside the base domain", async () => {
    const response = await mf.dispatchFetch("https://elsewhere.example/t/crm/");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("answers 404 for an unknown tool of a workspace, reading the platform D1", async () => {
    const response = await mf.dispatchFetch("https://acme.forgeron.test/t/ghost/");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});
