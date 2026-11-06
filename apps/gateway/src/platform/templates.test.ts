import {
  createRegistry,
  migratePlatform,
  TEMPLATE_WORKSPACE,
  type Registry,
} from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: TEMPLATE_WORKSPACE, name: "crm" });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "crm-1",
    manifest: { name: "crm", roles: {}, actions: {}, resources: { db: { why: "deals" } } },
    worker: "// crm",
  });
  await registry.publishVersion(tool.id, build.id, "1.2.0");
  // The matrix installs `crm` (a valid call); the cases below install this one.
  const other = await registry.createTool({ workspace: TEMPLATE_WORKSPACE, name: "inventory" });
  const stock = await registry.recordBuild(other.id, {
    fingerprint: "inventory-1",
    manifest: { name: "inventory", roles: {}, actions: {}, resources: {} },
    worker: "// inventory",
  });
  await registry.publishVersion(other.id, stock.id, "0.4.0");
  call = platformCaller({ registry, who: () => person });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};
const admin = { access: "admin" as const, call: through };

describeRouteMatrix({ title: "GET templates", ...admin, method: "GET", path: "/api/templates" });
describeRouteMatrix({
  title: "POST install a template",
  ...admin,
  method: "POST",
  path: "/api/templates/crm/install",
  noBody: true,
});

const url = (path: string) => `https://acme.forgeron.test${path}`;
const post = (path: string) => new Request(url(path), { method: "POST" });

describe("the template routes", () => {
  it("list the templates with what each asks for", async () => {
    const res = await through(new Request(url("/api/templates")), ADMIN);
    expect(await res.json()).toEqual({
      templates: [
        { name: "crm", version: "1.2.0", resources: ["resources.db"] },
        { name: "inventory", version: "0.4.0", resources: [] },
      ],
    });
  });

  it("install creates the tool for the workspace, audited as the caller, then 409 and 404", async () => {
    const res = await through(post("/api/templates/inventory/install"), ADMIN);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ tool: "inventory", version: "0.4.0", approvals: [] });
    const tool = (await registry.findTool("acme", "inventory"))!;
    const [line] = await registry.listAudit(tool.id);
    expect(line).toMatchObject({ kind: "install", actor: ADMIN.id, subject: "inventory:0.4.0" });
    expect(line!.via).toBeUndefined();

    const again = await through(post("/api/templates/inventory/install"), ADMIN);
    expect(again.status).toBe(409);
    const missing = await through(post("/api/templates/ghost/install"), ADMIN);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: "NOT_FOUND" });
  });

  it("answer 405 to a method the path does not take", async () => {
    const res = await through(new Request(url("/api/templates"), { method: "DELETE" }), ADMIN);
    expect(res.status).toBe(405);
  });
});
