import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { describeRouteMatrix } from "./route-matrix";
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
      roles: [],
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
  call: through,
  method: "GET",
  path: "/api/members",
  access: "admin",
});
describeRouteMatrix({
  title: "PATCH /api/members/<id>",
  call: through,
  method: "PATCH",
  get path() {
    return `/api/members/${memberId}`;
  },
  access: "admin",
  invalidMessage: "`roles` is a list of role names.",
  valid: { roles: ["dev"] },
  invalid: [
    {},
    { roles: "dev" },
    { roles: [1] },
    { roles: Array.from({ length: 21 }, () => "r") },
    [],
  ],
});
describeRouteMatrix({
  title: "DELETE /api/members/<id>",
  call: through,
  method: "DELETE",
  path: "/api/members/m-gone",
  access: "admin",
});
describeRouteMatrix({
  title: "POST /api/invitations",
  call: through,
  method: "POST",
  path: "/api/invitations",
  access: "admin",
  invalidMessage: "`email` and `roles` (a list of role names) are required.",
  valid: { email: "new@acme.test", roles: [] },
  invalid: [
    {},
    { email: "not an address" },
    { email: "a@b" },
    { email: "x".repeat(250) + "@acme.test" },
    { email: "new@acme.test", roles: "dev" },
    { email: "new@acme.test", roles: null },
  ],
});
describeRouteMatrix({
  title: "DELETE /api/invitations/<email>",
  call: through,
  method: "DELETE",
  path: "/api/invitations/gone%40acme.test",
  access: "admin",
});
describeRouteMatrix({
  title: "GET /api/membership-settings",
  call: through,
  method: "GET",
  path: "/api/membership-settings",
  access: "admin",
});
describeRouteMatrix({
  title: "PUT /api/membership-settings",
  call: through,
  method: "PUT",
  path: "/api/membership-settings",
  access: "admin",
  invalidMessage: "`domains` is a list of domains; `defaultRole` a role name or null.",
  valid: { domains: ["x.test"] },
  invalid: [{}, { domains: "x.test" }, { domains: [1] }, { domains: ["x.test"], defaultRole: 3 }],
});

describe("the members routes", () => {
  it("answer the way the old handler did on the cases the matrix does not cover", async () => {
    person = {
      id: "p",
      email: "a@acme.test",
      name: "A",
      admin: true,
      developer: false,
      roles: ["admin"],
    };
    const at = (path: string, init?: RequestInit) =>
      call(new Request(`https://acme.forgeron.test${path}`, init))!;
    const json = (method: string, body: unknown) => ({
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // The settings come from the install until an admin saves their own.
    expect(await (await at("/api/membership-settings"))!.json()).toEqual({
      domains: ["acme.test"],
      source: "install",
    });
    // A role name is trimmed, an unknown member is a 404, another method a 405.
    const put = await at(
      "/api/membership-settings",
      json("PUT", { domains: [" x.test "], defaultRole: "dev" }),
    );
    expect(await put!.json()).toEqual({
      domains: ["x.test"],
      defaultRole: "dev",
      source: "console",
    });
    expect((await at("/api/members/ghost", json("PATCH", { roles: [] })))!.status).toBe(404);
    expect((await at("/api/invitations/none%40acme.test", { method: "DELETE" }))!.status).toBe(404);
    expect((await at("/api/members/x", { method: "PUT" }))!.status).toBe(405);
    // An invitation is lower-cased, valid for 14 days, and says whether the mail went.
    const invited = await at(
      "/api/invitations",
      json("POST", { email: " New@Acme.test ", roles: [" dev "] }),
    );
    expect(invited!.status).toBe(201);
    expect(await invited!.json()).toEqual({
      invitation: { email: "new@acme.test", roles: ["dev"], expiresAt: expect.any(String) },
      notified: false,
    });
  });
});
