import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers (401, 403, 415, 400, the Origin check) of the approvals and revocation routes.
// What each does beyond them is in `console-api/workspace.test.ts` (approvals) and
// `gateway-tokens-secrets.test.ts` (revocations, through the whole gateway).

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
const admin = { access: "admin" as const, call: through };
const revocation = { forbidden: "Revocation is for admins." };

describeRouteMatrix({ title: "GET approvals", ...admin, method: "GET", path: "/api/approvals" });
describeRouteMatrix({
  title: "POST an approval decision",
  ...admin,
  method: "POST",
  path: "/api/approvals/apr_1",
  invalidMessage: "`decision` is `approved` or `rejected`.",
  valid: { decision: "approved" },
  invalid: [{}, { decision: "maybe" }, { decision: 1 }, { decision: "pending" }],
});
describeRouteMatrix({
  title: "POST revoke a person's tokens",
  ...admin,
  ...revocation,
  method: "POST",
  path: "/api/people/mem_1/tokens/revoke",
  noBody: true,
});
describeRouteMatrix({
  title: "GET user-secret holders",
  ...admin,
  ...revocation,
  method: "GET",
  path: "/api/tools/crm/user-secrets",
});
describeRouteMatrix({
  title: "DELETE a person's secrets",
  ...admin,
  ...revocation,
  method: "DELETE",
  path: "/api/tools/crm/user-secrets/mem_1",
});
describeRouteMatrix({
  title: "DELETE one secret of a person",
  ...admin,
  ...revocation,
  method: "DELETE",
  path: "/api/tools/crm/user-secrets/mem_1/ODOO_KEY",
});

describeRouteMatrix({
  title: "PUT one secret of a person",
  ...admin,
  ...revocation,
  method: "PUT",
  path: "/api/tools/crm/user-secrets/mem_1/ODOO_KEY",
  invalidMessage: "`value` is a non-empty string (16 KB max).",
  valid: { value: "test-value" },
  invalid: [{}, { value: "" }, { value: 1 }],
});

describeRouteMatrix({
  title: "POST re-seal the secrets",
  ...admin,
  forbidden: "Secrets are for admins.",
  method: "POST",
  path: "/api/secrets/reseal",
  noBody: true,
});

describeRouteMatrix({
  title: "GET user setup",
  ...admin,
  ...revocation,
  method: "GET",
  path: "/api/tools/crm/user-setup",
});
describeRouteMatrix({
  title: "DELETE a person's setup",
  ...admin,
  ...revocation,
  method: "DELETE",
  path: "/api/tools/crm/user-setup/mem_1",
});
describeRouteMatrix({
  title: "DELETE one value of a person's setup",
  ...admin,
  ...revocation,
  method: "DELETE",
  path: "/api/tools/crm/user-setup/mem_1/firstName",
});

describe("the revocation routes", () => {
  it("take no body: a POST without a content type is not a 415", async () => {
    person = {
      id: "p",
      email: "a@acme.test",
      name: "A",
      admin: true,
      developer: false,
      roles: ["admin"],
    };
    const res = (await call(
      new Request("https://acme.forgeron.test/api/people/ghost/tokens/revoke", { method: "POST" }),
    ))!;
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "NOT_FOUND", message: "There is no such person." });
  });
});

describe("re-sealing (D-108)", () => {
  const as = {
    id: "p-admin",
    email: "a@acme.test",
    name: "A",
    admin: true,
    developer: false,
    roles: ["admin"],
  };
  const post = () =>
    new Request("https://acme.forgeron.test/api/secrets/reseal", { method: "POST" });

  it("answers the counts and writes an audit line without a value", async () => {
    const reseal = vi.fn<() => Promise<{ resealed: number; current: number; unreadable: number }>>(
      async () => ({ resealed: 3, current: 1, unreadable: 0 }),
    );
    const caller = platformCaller({ registry, who: () => as, reseal });
    const res = (await caller(post()))!;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resealed: 3, current: 1, unreadable: 0 });
    expect(reseal).toHaveBeenCalledTimes(1);
  });

  it("answers 409 where the gateway has no key", async () => {
    const res = (await platformCaller({ registry, who: () => as })(post()))!;
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "NO_SECRET_KEY" });
  });
});

describe("the user setup routes (D-097)", () => {
  const as = {
    id: "p-admin",
    email: "a@acme.test",
    name: "A",
    admin: true,
    developer: false,
    roles: ["admin"],
  };
  const url = (path: string) => `https://acme.forgeron.test${path}`;

  it("list what people gave, with the member's name and email, clear one value or all, and 404 an unknown tool", async () => {
    const tool = (await registry.findTool("acme", "crm"))!;
    const ana = (
      await registry.addMember({
        workspace: "acme",
        subject: "ana",
        email: "ana@acme.test",
        name: "Ana",
        roles: [],
      })
    ).id;
    await registry.writeUserSetup({
      toolId: tool.id,
      person: ana,
      values: { firstName: "Ana", team: "sales" },
    });
    const listed = await through(new Request(url("/api/tools/crm/user-setup")), as);
    expect(await listed.json()).toEqual({
      people: [
        {
          person: ana,
          name: "Ana",
          email: "ana@acme.test",
          values: { firstName: "Ana", team: "sales" },
        },
      ],
    });
    const one = await through(
      new Request(url(`/api/tools/crm/user-setup/${ana}/team`), { method: "DELETE" }),
      as,
    );
    expect(await one.json()).toEqual({ revoked: 1 });
    const bad = await through(
      new Request(url(`/api/tools/crm/user-setup/${ana}/NOT_A_FIELD`), { method: "DELETE" }),
      as,
    );
    expect(bad.status).toBe(404);
    const all = await through(
      new Request(url(`/api/tools/crm/user-setup/${ana}`), { method: "DELETE" }),
      as,
    );
    expect(await all.json()).toEqual({ revoked: 1 });
    expect(await registry.readUserSetup(tool.id, ana)).toEqual({});
    const ghost = await through(new Request(url("/api/tools/ghost/user-setup")), as);
    expect(ghost.status).toBe(404);
  });
});
