import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { describeRouteMatrix, ADMIN } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers (401, 403, 415, 400) of the members, invitations and membership-settings routes,
// with the messages the console shows. What each does beyond them is in `gateway-email.test.ts`, which
// goes through the whole gateway.

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;
let memberId: string;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  memberId = (
    await registry.addMember({
      workspace: "acme",
      subject: "s1",
      email: "ada@acme.test",
      name: "Ada",
      teams: [],
    })
  ).id;
  call = platformCaller({ registry, who: () => person, installDomains: ["acme.test"] });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "GET /api/members",
  access: "members:read",
  call: through,
  method: "GET",
  path: "/api/members",
});
describeRouteMatrix({
  title: "PATCH /api/members/<id>",
  access: "members:write",
  call: through,
  method: "PATCH",
  get path() {
    return `/api/members/${memberId}`;
  },
  invalidMessage: "`teams` is a list of team ids.",
  valid: { teams: [] },
  invalid: [
    {},
    { teams: "dev" },
    { teams: [1] },
    { teams: Array.from({ length: 21 }, () => "r") },
    [],
  ],
});
describeRouteMatrix({
  title: "DELETE /api/members/<id>",
  access: "members:write",
  call: through,
  method: "DELETE",
  path: "/api/members/m-gone",
});
describeRouteMatrix({
  title: "POST /api/invitations",
  access: "members:write",
  call: through,
  method: "POST",
  path: "/api/invitations",
  invalidMessage: "`email` is required, `teams` a list of team ids.",
  valid: { email: "new@acme.test", teams: [] },
  invalid: [
    {},
    { email: "not an address" },
    { email: "a@b" },
    { email: "x".repeat(250) + "@acme.test" },
    { email: "new@acme.test", teams: "dev" },
    { email: "new@acme.test", teams: null },
  ],
});
describeRouteMatrix({
  title: "DELETE /api/invitations/<email>",
  access: "members:write",
  call: through,
  method: "DELETE",
  path: "/api/invitations/gone%40acme.test",
});
describeRouteMatrix({
  title: "GET /api/membership-settings",
  access: "members:read",
  call: through,
  method: "GET",
  path: "/api/membership-settings",
});
describeRouteMatrix({
  title: "PUT /api/membership-settings",
  access: "members:write",
  call: through,
  method: "PUT",
  path: "/api/membership-settings",
  invalidMessage: "`domains` is a list of domains; `defaultTeams` a list of team ids.",
  valid: { domains: ["x.test"] },
  invalid: [{}, { domains: "x.test" }, { domains: [1] }, { domains: ["x.test"], defaultTeams: 3 }],
});

describe("the members routes", () => {
  it("answer the way the old handler did on the cases the matrix does not cover", async () => {
    person = {
      id: "p",
      email: "a@acme.test",
      name: "A",
      teams: ["admin"],
      permissions: ADMIN.permissions,
    };
    // A workspace of its own: the matrix above saved settings for `acme`.
    const fresh = platformCaller({
      registry,
      workspace: "fresh",
      who: () => person,
      installDomains: ["acme.test"],
    });
    const at = (path: string, init?: RequestInit) =>
      fresh(new Request(`https://acme.forgeron.test${path}`, init))!;
    const json = (method: string, body: unknown) => ({
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // The settings come from the install until someone who manages members saves their own.
    expect(await (await at("/api/membership-settings"))!.json()).toEqual({
      domains: ["acme.test"],
      defaultTeams: [],
      source: "install",
    });
    // A team id is trimmed, an unknown member is a 404, another method a 405.
    const put = await at(
      "/api/membership-settings",
      json("PUT", { domains: [" x.test "], defaultTeams: [" developer "] }),
    );
    expect(await put!.json()).toEqual({
      domains: ["x.test"],
      defaultTeams: ["developer"],
      source: "console",
    });
    expect((await at("/api/members/ghost", json("PATCH", { teams: [] })))!.status).toBe(404);
    expect((await at("/api/invitations/none%40acme.test", { method: "DELETE" }))!.status).toBe(404);
    expect((await at("/api/members/x", { method: "PUT" }))!.status).toBe(405);
    // An invitation is lower-cased, valid for 14 days, and says whether the mail went.
    const invited = await at(
      "/api/invitations",
      json("POST", { email: " New@Acme.test ", teams: [" developer "] }),
    );
    expect(invited!.status).toBe(201);
    expect(await invited!.json()).toEqual({
      invitation: { email: "new@acme.test", teams: ["developer"], expiresAt: expect.any(String) },
      notified: false,
    });
  });
});
