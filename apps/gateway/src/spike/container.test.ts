// SPIKE FOR-144: scope isolation, and the container running inside workerd (Miniflare).
import type { D1Database } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRequestScope, createRoot } from "./container";

let dir: string;
let mf: Miniflare;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "spike-"));
  const file = join(dir, "worker.js");
  const proc = spawnSync("bun", [
    join(import.meta.dirname, "..", "..", "scripts", "spike-build.ts"),
    file,
  ]);
  if (proc.status !== 0) throw new Error(String(proc.stderr));
  mf = new Miniflare({
    modules: [{ type: "ESModule", path: "worker.js", contents: await readFile(file, "utf8") }],
    compatibilityDate: "2026-08-06",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "platform" },
    bindings: { BASE_DOMAIN: "forgeron.test", AUTH_SECRET: "x".repeat(44) },
  });
  await migratePlatform((await mf.getD1Database("DB")) as unknown as D1Database);
}, 60_000);

afterAll(async () => {
  await mf?.dispose();
  await rm(dir, { recursive: true, force: true });
});

describe("awilix scope per request", () => {
  it("gives each request its own workspace and request, and one shared clock", () => {
    const root = createRoot();
    const d1 = {} as never;
    const a = createRequestScope(root, {
      d1,
      workspace: "acme",
      request: new Request("https://a/"),
      secret: "s",
    });
    const b = createRequestScope(root, {
      d1,
      workspace: "beta",
      request: new Request("https://b/"),
      secret: "s",
    });
    expect(a.cradle.workspace).toBe("acme");
    expect(b.cradle.workspace).toBe("beta");
    expect(a.cradle.registry).not.toBe(b.cradle.registry);
    expect(a.cradle.caller).not.toBe(b.cradle.caller);
    expect(a.cradle.clock).toBe(b.cradle.clock);
  });

  it("refuses a singleton that depends on a scoped value (strict)", () => {
    const root = createRoot();
    expect(() => root.cradle.registry).toThrow(/identify|registry|resolve/i);
  });

  it("runs in workerd: anonymous request resolves to nobody", async () => {
    const response = await mf.dispatchFetch("https://acme.forgeron.test/spike/whoami");
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({ person: null });
  });

  it("still serves the real gateway for the other routes", async () => {
    const response = await mf.dispatchFetch("https://elsewhere.example/t/crm/");
    expect(response.status).toBe(404);
  });
});
