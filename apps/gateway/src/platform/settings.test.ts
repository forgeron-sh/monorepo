import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { describeRouteMatrix, ADMIN } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers (401, 403, 415, 400) of the identity-provider, connector-client and secrets
// routes. What each does beyond them is in `gateway-sso.test.ts`, `gateway-saml.test.ts`,
// `gateway-cli-login.test.ts` and `console-api/secrets.test.ts`.

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  call = platformCaller({ registry, who: () => person });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "GET identity-provider",
  access: "settings:read",
  call: through,
  method: "GET",
  path: "/api/identity-provider",
});
describeRouteMatrix({
  title: "PUT identity-provider",
  access: "settings:write",
  call: through,
  method: "PUT",
  path: "/api/identity-provider",
  valid: { kind: "google", clientId: "x" },
});
describeRouteMatrix({
  title: "DELETE identity-provider",
  access: "settings:write",
  call: through,
  method: "DELETE",
  path: "/api/identity-provider",
});
describeRouteMatrix({
  title: "GET connector-clients",
  access: "settings:read",
  call: through,
  method: "GET",
  path: "/api/connector-clients",
});
describeRouteMatrix({
  title: "PUT connector-client",
  access: "settings:write",
  call: through,
  method: "PUT",
  path: "/api/connector-clients/microsoft-365",
  valid: { clientId: "x" },
});
describeRouteMatrix({
  title: "DELETE connector-client",
  access: "settings:write",
  call: through,
  method: "DELETE",
  path: "/api/connector-clients/microsoft-365",
});
describeRouteMatrix({
  title: "GET secrets",
  access: "tools:secrets",
  call: through,
  method: "GET",
  path: "/api/tools/crm/environments/production/secrets",
});
describeRouteMatrix({
  title: "PUT a secret",
  access: "tools:secrets",
  call: through,
  method: "PUT",
  path: "/api/tools/crm/environments/production/secrets/ODOO_KEY",
  invalidMessage: "`value` is a non-empty string (16 KB max).",
  valid: { value: "x" },
  invalid: [{}, { value: "" }, { value: 1 }, { value: "x".repeat(16 * 1024 + 1) }],
});
describeRouteMatrix({
  title: "POST a request to enter a secret",
  access: "tools:write",
  call: through,
  method: "POST",
  path: "/api/tools/crm/environments/production/secrets/ODOO_KEY/request",
  noBody: true,
});
const TOKEN = "t".repeat(43);
describeRouteMatrix({
  title: "POST lookup of a secret request",
  access: "signed-in",
  call: through,
  method: "POST",
  path: "/api/secret-requests/lookup",
  invalidMessage: "Send `{ token }`.",
  valid: { token: TOKEN },
  invalid: [{}, { token: "short" }, { token: TOKEN, extra: 1 }],
});
describeRouteMatrix({
  title: "POST fulfilment of a secret request",
  access: "signed-in",
  call: through,
  method: "POST",
  path: "/api/secret-requests/fulfil",
  invalidMessage: "Send `{ token, value }`; `value` is 16 KB at most.",
  valid: { token: TOKEN, value: "x" },
  invalid: [
    { token: TOKEN },
    { token: TOKEN, value: "" },
    { value: "x" },
    { token: TOKEN, value: 1 },
  ],
});

describe("the identity and secrets routes", () => {
  it("answer a bad provider with the parser's own message, and 405 to another method", async () => {
    person = {
      id: "p",
      email: "a@acme.test",
      name: "A",
      teams: ["admin"],
      permissions: ADMIN.permissions,
    };
    const bad = (await call(
      new Request("https://acme.forgeron.test/api/identity-provider", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "ldap" }),
      }),
    ))!;
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({
      error: "INVALID",
      message: "`kind` must be oidc, entra or google.",
    });
    const post = (await call(
      new Request("https://acme.forgeron.test/api/identity-provider", { method: "POST" }),
    ))!;
    expect(post.status).toBe(405);
  });
});
