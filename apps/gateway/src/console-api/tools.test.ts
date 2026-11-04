import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { handleTools, listTools } from "./tools";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let caller: object | undefined = {};

const call = (path = "/api/tools", method = "GET", workspace = "acme") =>
  handleTools(new Request(`https://acme.forgeron.test${path}`, { method }), {
    registry,
    workspace,
    caller: async () => caller,
  });

async function deploy(
  workspace: string,
  name: string,
  versions: Record<string, [environment: "preview" | "production", branch?: string]>,
) {
  const tool = await registry.createTool({ workspace, name });
  const description = name === "odoo" ? { description: "Tickets and invoices." } : {};
  for (const [version, [environment, branch]] of Object.entries(versions)) {
    const build = await registry.recordBuild(tool.id, {
      fingerprint: `fp-${name}-${version}`,
      manifest: { name, ...description },
    });
    const published = await registry.publishVersion(tool.id, build.id, version);
    const target = await registry.ensureEnvironment(tool.id, environment, branch);
    await registry.activate(target.id, published.id, { actor: "test" });
  }
}

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  await deploy("acme", "crm", {
    "1.0.0": ["production"],
    "1.2.0-rc": ["preview", "feat-export"],
  });
  await deploy("acme", "odoo", { "0.3.0": ["production"] });
  await registry.createTool({ workspace: "acme", name: "draft" });
  await deploy("globex", "crm", { "9.0.0": ["production"] });
});
afterAll(() => memory.close());

describe("the tools of a workspace", () => {
  it("lists each tool with its version per environment, from this workspace only", async () => {
    expect(await listTools(registry, "acme")).toEqual([
      {
        name: "crm",
        production: "1.0.0",
        previews: [{ branch: "feat-export", version: "1.2.0-rc" }],
        summary: null,
        lastDeployment: { at: expect.any(String), version: "1.2.0-rc" },
      },
      { name: "draft", production: null, previews: [], summary: null, lastDeployment: null },
      {
        name: "odoo",
        production: "0.3.0",
        previews: [],
        summary: "Tickets and invoices.",
        lastDeployment: { at: expect.any(String), version: "0.3.0" },
      },
    ]);
  });

  it("answers the route with the same listing", async () => {
    const response = (await call())!;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ tools: await listTools(registry, "acme") });
  });

  it("refuses an anonymous caller, other methods, and ignores other routes", async () => {
    caller = undefined;
    expect((await call())!.status).toBe(401);
    caller = {};
    expect((await call("/api/tools", "POST"))!.status).toBe(405);
    expect(await call("/api/tools/crm")).toBeUndefined();
  });
});
