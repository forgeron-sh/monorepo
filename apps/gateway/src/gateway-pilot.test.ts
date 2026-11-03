import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "./gateway";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The pilot version is served at the production address to the members of the pilot group (FOR-57).
let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
const ids: Record<string, string> = {};

const tools = new Map(
  ["acme--crm--production", "acme--crm--pilot"].map((name) => [
    name,
    { fetch: () => Response.json({ worker: name }) },
  ]),
);
const env = (): GatewayEnv => ({
  DB: d1,
  BASE_DOMAIN: "forgeron.app",
  DISPATCHER: {
    get: (worker) => tools.get(worker) ?? { fetch: () => new Response(null, { status: 502 }) },
  },
});

/** The caller is whoever the `x-person` header names: identity itself is tested elsewhere. */
const gateway = () =>
  createGateway(env(), { identify: ({ request }) => request.headers.get("x-person") ?? undefined });

const served = async (person?: string) => {
  const response = await gateway()(
    new Request("https://acme.forgeron.app/t/crm/mcp", {
      headers: person ? { "x-person": ids[person]! } : {},
    }),
  );
  return ((await response.json()) as { worker: string }).worker;
};

beforeAll(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  for (const name of ["ada", "bob"]) {
    const member = await registry.addMember({
      workspace: "acme",
      subject: name,
      email: `${name}@acme.test`,
      name,
      roles: [],
    });
    ids[name] = member.id;
  }
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const record = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest: { name: "crm" },
  });
  const version = await registry.publishVersion(tool.id, record.id, "1.0.0");
  for (const name of ["production", "pilot"] as const) {
    const slot = await registry.ensureEnvironment(tool.id, name);
    await registry.activate(slot.id, version.id, { actor: "test" });
  }
});
afterAll(() => memory.close());

describe("pilot routing at the production address", () => {
  it("serves production to everyone while the pilot has no group", async () => {
    expect(await served("ada")).toBe("acme--crm--production");
  });

  it("serves the pilot to the members of its group, and production to everyone else", async () => {
    const tool = (await registry.findTool("acme", "crm"))!;
    const pilot = (await registry.listEnvironments(tool.id)).find((e) => e.name === "pilot")!;
    await registry.setPilotGroup(pilot.id, "early");
    await registry.setGroupMembers("acme", "early", [ids.ada!]);

    expect(await served("ada")).toBe("acme--crm--pilot");
    expect(await served("bob")).toBe("acme--crm--production");
    expect(await served()).toBe("acme--crm--production");
  });

  it("follows the group's members at once", async () => {
    await registry.setGroupMembers("acme", "early", [ids.bob!]);
    expect(await served("ada")).toBe("acme--crm--production");
    expect(await served("bob")).toBe("acme--crm--pilot");
  });

  it("serves production to everyone when the gateway has no identity", async () => {
    const response = await createGateway(env())(new Request("https://acme.forgeron.app/t/crm/mcp"));
    expect(((await response.json()) as { worker: string }).worker).toBe("acme--crm--production");
  });
});
