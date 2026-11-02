import { describe, expect, it } from "vitest";
import { createTestTool, management, sales, support } from "./helpers";

const rpc = (method: string, params?: unknown) => ({
  method: "POST",
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
});
type Tool = { name: string; annotations: Record<string, boolean> };

async function toolsOf(person: Parameters<typeof createTestTool>[0]) {
  const tool = await createTestTool(person);
  const { result } = (await (await tool.fetch("/mcp", rpc("tools/list"))).json()) as {
    result: { tools: Tool[] };
  };
  return result.tools;
}

describe("MCP", () => {
  it("shows each role the tools it may call, and nobody the others", async () => {
    const read = ["crm_companies_list", "crm_contacts_search", "crm_deals_list"];
    const write = [
      "crm_companies_upsert",
      "crm_contacts_create",
      "crm_contacts_update",
      "crm_deals_create",
      "crm_deals_move",
    ];
    const names = async (as: object) => (await toolsOf({ as })).map((t) => t.name).sort();

    expect(await names(support)).toEqual(read);
    expect(await names(sales)).toEqual([...read, ...write].sort());
    expect(await names(management)).toEqual([...read, ...write, "crm_deals_delete"].sort());
  });

  it("flags deletion as destructive and reads as read-only", async () => {
    const tools = await toolsOf({ as: management });
    expect(tools.find((t) => t.name === "crm_deals_delete")?.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
    });
    expect(tools.find((t) => t.name === "crm_deals_list")?.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
    });
  });

  it("calls a tool: moving a lead writes its history", async () => {
    const tool = await createTestTool({ as: sales });
    const company = (await tool.call("companies.upsert", { name: "Acme" })) as { id: string };
    const deal = (await tool.call("deals.create", { company_id: company.id, title: "T" })) as {
      id: string;
    };
    const response = await tool.fetch(
      "/mcp",
      rpc("tools/call", { name: "crm_deals_move", arguments: { id: deal.id, stage: "won" } }),
    );
    const { result } = (await response.json()) as {
      result: { isError: boolean; structuredContent: unknown };
    };
    expect(result).toMatchObject({
      isError: false,
      structuredContent: { id: deal.id, stage: "won" },
    });
    expect(await tool.db.selectFrom("deal_events").select("to_stage").execute()).toEqual([
      { to_stage: "won" },
    ]);
  });

  it("refuses a read-only role over MCP too, as a tool error", async () => {
    const tool = await createTestTool({ as: support });
    const response = await tool.fetch(
      "/mcp",
      rpc("tools/call", { name: "crm_deals_move", arguments: { id: "x", stage: "won" } }),
    );
    const { error, result } = (await response.json()) as {
      error?: unknown;
      result?: { isError: boolean };
    };
    // The tool is not even listed for them: unknown tool.
    expect(error ?? result?.isError).toBeTruthy();
  });
});

describe("API and CLI", () => {
  it("serves the API: GET for a read, POST for a write", async () => {
    const tool = await createTestTool({ as: sales });
    expect((await tool.fetch("/api/deals.list")).status).toBe(200);
    const created = await tool.fetch("/api/companies.upsert", {
      method: "POST",
      body: JSON.stringify({ name: "Acme" }),
    });
    expect(await created.json()).toMatchObject({ name: "Acme" });
    expect((await tool.fetch("/api/companies.upsert")).status).toBe(405);
  });

  it("serves the commands, with the arguments of cli.args", async () => {
    const tool = await createTestTool({ as: management });
    const { commands } = (await (await tool.fetch("/cli")).json()) as {
      commands: Array<{ command: string; args: Array<{ name: string }> }>;
    };
    const byCommand = (command: string) => commands.find((c) => c.command === command);
    expect(byCommand("forgeron crm contacts search")?.args.map((a) => a.name)).toEqual(["query"]);
    expect(byCommand("forgeron crm deals move")?.args.map((a) => a.name)).toEqual(["id", "stage"]);
    expect(byCommand("forgeron crm deals delete")).toMatchObject({ args: [{ name: "id" }] });
  });
});
