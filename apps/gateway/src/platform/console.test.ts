import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers (401, 403, 415, 400) of the workspace, audit and access-matrix routes. What each
// one answers beyond them is in `workspace.test.ts` and `gateway-access.test.ts`.

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  await registry.createTool({ workspace: "acme", name: "crm" });
  call = platformCaller({ registry, who: () => person });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "GET /api/workspace",
  call: through,
  method: "GET",
  path: "/api/workspace",
  access: "member",
});
describeRouteMatrix({
  title: "GET /api/audit",
  call: through,
  method: "GET",
  path: "/api/audit",
  access: "admin",
});
describeRouteMatrix({
  title: "GET /api/usage",
  call: through,
  method: "GET",
  path: "/api/usage",
  access: "admin",
});
describeRouteMatrix({
  title: "GET /api/tools/crm/access-matrix",
  call: through,
  method: "GET",
  path: "/api/tools/crm/access-matrix",
  access: "admin",
  forbidden: "The access matrix is for admins.",
});
describeRouteMatrix({
  title: "PUT /api/tools/crm/access-matrix",
  call: through,
  method: "PUT",
  path: "/api/tools/crm/access-matrix",
  access: "admin",
  forbidden: "The access matrix is for admins.",
  invalidMessage: "`changes` is 1 to 500 of { role, action, allowed: true, false or null }.",
  valid: { changes: [{ role: "viewer", action: "deals.list", allowed: true }] },
  invalid: [
    {},
    { changes: [] },
    { changes: "all" },
    { changes: [{ role: "viewer", action: "deals.list" }] },
    { changes: [{ role: 1, action: "deals.list", allowed: true }] },
    { changes: Array.from({ length: 501 }, () => ({ role: "r", action: "a", allowed: null })) },
  ],
});

describeRouteMatrix({
  title: "GET connections",
  call: through,
  method: "GET",
  path: "/api/tools/crm/environments/production/connections",
  access: "admin",
  forbidden: "Connections are for admins.",
});
describeRouteMatrix({
  title: "DELETE one connection",
  call: through,
  method: "DELETE",
  path: "/api/tools/crm/environments/production/connections/ada%40example.test/microsoft-365",
  access: "admin",
  forbidden: "Connections are for admins.",
});
describeRouteMatrix({
  title: "GET secrets-status",
  call: through,
  method: "GET",
  path: "/api/tools/crm/secrets-status",
  access: "developer",
  forbidden: "Secrets status is for developers and admins.",
});

describe("the connections routes", () => {
  it("answer 404 for an unknown environment, and 400 for a person that is not a valid encoding", async () => {
    person = {
      id: "p",
      email: "a@acme.test",
      name: "A",
      admin: true,
      developer: false,
      roles: ["admin"],
    };
    const base = "https://acme.forgeron.test/api/tools/crm/environments";
    expect((await call(new Request(`${base}/staging/connections`)))!.status).toBe(404);
    const bad = (await call(
      new Request(`${base}/production/connections/%E0%A4%A/microsoft-365`, { method: "DELETE" }),
    ))!;
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: "INVALID", message: "The person is not valid." });
    expect(
      (await call(new Request(`${base}/production/connections`, { method: "POST" })))!.status,
    ).toBe(405);
  });
});

describe("the access matrix", () => {
  it("answers 404 for an unknown tool to an admin, and 405 to a method it does not take", async () => {
    person = {
      id: "p",
      email: "a@acme.test",
      name: "A",
      admin: true,
      developer: false,
      roles: ["admin"],
    };
    const ghost = (await call(
      new Request("https://acme.forgeron.test/api/tools/ghost/access-matrix"),
    ))!;
    expect(ghost.status).toBe(404);
    const post = (await call(
      new Request("https://acme.forgeron.test/api/tools/crm/access-matrix", { method: "POST" }),
    ))!;
    expect(post.status).toBe(405);
  });
});

describe("GET /api/usage (D-093)", () => {
  const ask = (query: string) =>
    through(new Request(`https://acme.forgeron.test/api/usage${query}`), ADMIN);

  it("reports the period asked, by tool and by person, and refuses a period that makes no sense", async () => {
    await registry.recordUsage("acme", "crm", ADMIN.id);
    const day = new Date().toISOString().slice(0, 10);
    const ok = await ask(`?from=${day}&to=${day}`);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({
      from: day,
      to: day,
      tools: [{ tool: "crm", calls: 1, people: 1 }],
    });
    expect((await ask("?from=2026-11-05&to=2026-11-01")).status).toBe(400);
    expect((await ask("?from=2020-01-01&to=2026-11-01")).status).toBe(400);
    expect((await ask("?from=yesterday")).status).toBe(400);
  });
});
