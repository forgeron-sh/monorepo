import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers (401, 403) of the tool routes. What each route answers beyond them is in
// `console-api/tools.test.ts`, `tool-pages.test.ts` and `manifest.test.ts`, which call the same app.

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
  title: "GET /api/tools",
  call: through,
  method: "GET",
  path: "/api/tools",
  access: "signed-in",
});
for (const leaf of ["branches", "versions", "activity"]) {
  describeRouteMatrix({
    title: `GET /api/tools/crm/${leaf}`,
    call: through,
    method: "GET",
    path: `/api/tools/crm/${leaf}`,
    access: "tools:read",
  });
}
describeRouteMatrix({
  title: "GET /api/tools/crm/manifest",
  call: through,
  method: "GET",
  path: "/api/tools/crm/manifest",
  access: "tools:read",
});

describe("the tool routes", () => {
  it("answer 404 for an unknown tool only to someone who may read it", async () => {
    person = {
      id: "p",
      email: "p@acme.test",
      name: "P",
      teams: [],
      permissions: [],
    };
    expect(
      (await call(new Request("https://acme.forgeron.test/api/tools/ghost/versions")))!.status,
    ).toBe(403);
    person = {
      id: "p",
      email: "p@acme.test",
      name: "P",
      teams: ["developer"],
      permissions: ["tools:read"],
    };
    const res = (await call(new Request("https://acme.forgeron.test/api/tools/ghost/versions")))!;
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "NOT_FOUND", message: "There is no such tool." });
  });
});
