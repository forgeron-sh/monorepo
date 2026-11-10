import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The guards of the library routes (D-117); what they do is driven through the whole gateway in
// integration/gateway-library.test.ts.

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;

beforeAll(async () => {
  memory = await createMemoryD1();
  await migratePlatform(memory as unknown as D1Database);
  registry = createRegistry(memory as unknown as D1Database);
  await registry.createTool({ workspace: "acme", name: "crm" });
  await registry.createTool({ workspace: "acme", name: "fresh" });
  call = platformCaller({ registry, who: () => person });
});
afterAll(() => memory.close());

const as = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "GET the library",
  access: "member",
  call: as,
  method: "GET",
  path: "/api/library",
});
describeRouteMatrix({
  title: "GET a tool's availability",
  access: "admin",
  call: as,
  method: "GET",
  path: "/api/tools/crm/availability",
});
describeRouteMatrix({
  title: "PUT a tool's availability",
  access: "admin",
  call: as,
  method: "PUT",
  path: "/api/tools/crm/availability",
  valid: { mode: "everyone" },
  invalid: [{}, { mode: "all" }, { mode: "roles", roles: "support" }],
});

describe("the availability routes", () => {
  it("say open for a tool with no rule, 404 for no tool, and refuse a person who is not a member", async () => {
    const url = (p: string) => `https://acme.forgeron.test${p}`;
    expect(
      await (await as(new Request(url("/api/tools/fresh/availability")), ADMIN)).json(),
    ).toEqual({
      mode: "open",
      roles: [],
      people: [],
      updatedAt: null,
    });
    expect((await as(new Request(url("/api/tools/ghost/availability")), ADMIN)).status).toBe(404);
    const put = await as(
      new Request(url("/api/tools/crm/availability"), {
        method: "PUT",
        headers: { "content-type": "application/json", origin: "https://acme.forgeron.test" },
        body: JSON.stringify({ mode: "people", people: ["p-nobody"] }),
      }),
      ADMIN,
    );
    expect(put.status).toBe(400);
  });
});
