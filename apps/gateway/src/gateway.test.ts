import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "./gateway";
import worker from "./index";

// Miniflare is slow when the machine is busy.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let mf: Miniflare;
let d1: D1Database;
let registry: Registry;
const reached: string[] = [];

const tools = new Map(
  [
    "acme--crm--production",
    "acme--crm--pilot",
    "acme--crm--pr-12",
    "acme--odoo--production",
    "globex--crm--production",
  ].map((name) => [
    name,
    {
      fetch: (request: Request) => {
        reached.push(name);
        return Response.json({ worker: name, path: new URL(request.url).pathname });
      },
    },
  ]),
);

// What a dispatch namespace does for a script it does not hold: `fetch` throws.
const missing = (worker: string) => ({
  fetch: (): Response => {
    throw new Error(`Worker not found: ${worker}`);
  },
});

const env = (): GatewayEnv => ({
  DB: d1,
  BASE_DOMAIN: "forgeron.app",
  DISPATCHER: { get: (worker) => tools.get(worker) ?? missing(worker) },
});

async function publish(workspace: string, name: string, deployed: [string, string?][]) {
  const tool = await registry.createTool({ workspace, name });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: `fp-${workspace}-${name}`,
    manifest: { name },
  });
  const version = await registry.publishVersion(tool.id, build.id, "1.0.0");
  for (const [environment, branch] of deployed) {
    const target = await registry.ensureEnvironment(tool.id, environment as "production", branch);
    await registry.activate(target.id, version.id, { actor: "test" });
  }
  return tool;
}

beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  await publish("acme", "crm", [["production"], ["pilot"], ["preview", "feat-export"]]);
  await publish("acme", "odoo", [["production"]]);
  await publish("globex", "crm", [["production"]]);
  // Created, never activated: nothing serves it yet.
  const draft = await registry.createTool({ workspace: "acme", name: "draft" });
  await registry.ensureEnvironment(draft.id, "production");
});
afterAll(() => mf.dispose());

const get = async (url: string, gateway = createGateway(env())) => {
  const response = await gateway(new Request(url));
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

describe("the gateway, with the platform D1", () => {
  it("routes a workspace's tool to its production Worker", async () => {
    expect(await get("https://acme.forgeron.app/t/crm/api/deals.move")).toEqual({
      status: 200,
      body: { worker: "acme--crm--production", path: "/api/deals.move" },
    });
    expect((await get("https://globex.forgeron.app/t/crm/mcp")).body.worker).toBe(
      "globex--crm--production",
    );
    expect((await get("https://acme.forgeron.app/t/odoo/mcp")).body.worker).toBe(
      "acme--odoo--production",
    );
  });

  it("answers 404 for a tool or workspace the registry does not know, or one never activated", async () => {
    reached.length = 0;
    for (const url of [
      "https://acme.forgeron.app/t/missing/mcp",
      "https://nobody.forgeron.app/t/crm/mcp",
      "https://globex.forgeron.app/t/odoo/mcp",
      "https://acme.forgeron.app/t/draft/mcp",
    ]) {
      expect({ url, status: (await get(url)).status }).toEqual({ url, status: 404 });
    }
    expect(reached).toEqual([]);
  });

  it("serves production to everyone while nothing says who is in the pilot group", async () => {
    expect((await get("https://acme.forgeron.app/t/crm/mcp")).body.worker).toBe(
      "acme--crm--production",
    );
  });

  it("does not route a preview until the platform records its Worker, and then still needs identity", async () => {
    // No default name for a preview: it is not routable.
    expect((await get("https://acme.forgeron.app/t/crm@feat-export/mcp")).status).toBe(404);
    // Given a name, it is routable, but nobody may see it without identity (fails closed).
    const named = createGateway(env(), {
      workerNameOf: (tool, environment) =>
        environment.name === "preview" ? `${tool.workspace}--${tool.name}--pr-12` : undefined,
    });
    reached.length = 0;
    expect((await get("https://acme.forgeron.app/t/crm@feat-export/mcp", named)).status).toBe(403);
    expect(reached).toEqual([]);
  });

  it("answers 502 for a deployed tool the gateway holds no binding to", async () => {
    const response = await createGateway({ ...env(), DISPATCHER: { get: missing } })(
      new Request("https://acme.forgeron.app/t/crm/mcp"),
    );
    expect(response.status).toBe(502);
  });

  it("is the Worker's fetch handler", async () => {
    const response = await worker.fetch(new Request("https://acme.forgeron.app/t/crm/mcp"), env());
    expect(response.status).toBe(200);
  });
});
