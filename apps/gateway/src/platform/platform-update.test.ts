import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import type { UpdateRun } from "@forgeron/platform-contract";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PlatformUpdate, StartResult } from "../platform-update/update";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix, holding } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The three routes of the platform updating itself (D-138): who may call them, and what each answers.
// The update itself, against a simulated GitHub and Cloudflare, is in `platform-update/update.test.ts`.

const run: UpdateRun = {
  id: "r1",
  from: "0.5.0",
  to: "0.6.0",
  state: "running",
  steps: [{ name: "download", state: "running" }],
  startedAt: "2026-11-13T10:00:00.000Z",
};

let memory: MemoryD1;
let person: ConsolePerson | undefined;
let started: StartResult = { status: "started", run };
let asked: { version: string; actor: string }[] = [];
let call: (request: Request) => Promise<Response | undefined>;

const update: PlatformUpdate = {
  state: async () => ({ current: { version: "0.5.0" }, available: false }),
  start: async (version, actor) => {
    asked.push({ version, actor });
    return started;
  },
  run: async (id) => (id === "r1" ? run : undefined),
};

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  const registry: Registry = createRegistry(d1);
  call = platformCaller({ registry, who: () => person, update });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "GET /api/platform/update",
  access: "settings:read",
  call: through,
  method: "GET",
  path: "/api/platform/update",
});
describeRouteMatrix({
  title: "POST /api/platform/update",
  access: "platform:update",
  call: through,
  method: "POST",
  path: "/api/platform/update",
  valid: { version: "0.6.0" },
  invalid: [
    {},
    { version: "v0.6.0" },
    { version: "0.6" },
    { version: 6 },
    { version: "0.6.0", x: 1 },
  ],
});
describeRouteMatrix({
  title: "GET /api/platform/update/runs/{id}",
  access: "settings:read",
  call: through,
  method: "GET",
  path: "/api/platform/update/runs/r1",
});

const post = (who: ConsolePerson, version = "0.6.0") =>
  through(
    new Request("https://acme.forgeron.test/api/platform/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version }),
    }),
    who,
  );

describe("the platform update routes", () => {
  it("lets settings:read see, and only platform:update start (which implies settings:read)", async () => {
    const reader = holding("settings:read");
    expect((await post(reader)).status).toBe(403);
    const read = await through(
      new Request("https://acme.forgeron.test/api/platform/update"),
      reader,
    );
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({ current: { version: "0.5.0" }, available: false });
    const updater = holding("platform:update");
    expect(updater.permissions).toContain("settings:read");
    expect((await post(updater)).status).toBe(202);
  });

  it("answers 202 with the run, and tells who started it", async () => {
    asked = [];
    started = { status: "started", run };
    const res = await post(ADMIN);
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ run });
    expect(asked).toEqual([{ version: "0.6.0", actor: ADMIN.id }]);
  });

  it("answers 409 RUNNING, NOT_NEWER, and the reason a platform cannot update itself", async () => {
    started = { status: "running" };
    expect(await (await post(ADMIN)).json()).toMatchObject({ error: "RUNNING" });
    started = { status: "not-newer", current: "0.7.0" };
    const refused = await post(ADMIN, "0.6.0");
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ error: "NOT_NEWER" });
    started = { status: "blocked", blocked: { code: "OFF", message: "Turned off." } };
    const off = await post(ADMIN);
    expect(off.status).toBe(409);
    expect(await off.json()).toEqual({ error: "OFF", message: "Turned off." });
  });

  it("reads a run, and answers 404 for one that does not exist", async () => {
    const ask = (id: string) =>
      through(new Request(`https://acme.forgeron.test/api/platform/update/runs/${id}`), ADMIN);
    expect(await (await ask("r1")).json()).toEqual({ run });
    const missing = await ask("nope");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: "NOT_FOUND" });
  });

  it("answers 405 for a method the path does not take", async () => {
    const res = await through(
      new Request("https://acme.forgeron.test/api/platform/update", { method: "DELETE" }),
      ADMIN,
    );
    expect(res.status).toBe(405);
  });
});
