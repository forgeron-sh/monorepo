import { describe, expect, it } from "vitest";
import { admin, createTestTool, reader, technician } from "./helpers";

const rpc = (method: string, params?: unknown) => ({
  method: "POST",
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
});

async function toolNames(as: object) {
  const tool = await createTestTool({ as });
  const { result } = (await (await tool.fetch("/mcp", rpc("tools/list"))).json()) as {
    result: { tools: Array<{ name: string }> };
  };
  return result.tools.map((t) => t.name).sort();
}

describe("MCP", () => {
  const read = [
    "inventory_equipments_get",
    "inventory_equipments_search",
    "inventory_sites_list",
    "inventory_sync-runs_list",
  ];
  const write = [
    "inventory_equipments_attach",
    "inventory_equipments_set-attributes",
    "inventory_sites_create",
  ];

  it("shows each role the tools it may call; import is for admins only", async () => {
    expect(await toolNames(reader)).toEqual(read.sort());
    expect(await toolNames(technician)).toEqual([...read, ...write].sort());
    expect(await toolNames(admin)).toEqual(
      [...read, ...write, "inventory_equipments_import"].sort(),
    );
  });
});

describe("API", () => {
  it("searches equipment over HTTP", async () => {
    const tool = await createTestTool({ as: admin, seed: true });
    const response = await tool.fetch("/api/equipments.search?city=Lyon");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [{ ref: "CH-002" }], nextCursor: null });
  });
});
