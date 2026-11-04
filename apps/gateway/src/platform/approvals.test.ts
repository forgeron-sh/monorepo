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
