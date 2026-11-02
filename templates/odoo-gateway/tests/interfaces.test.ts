import { describe, expect, it } from "vitest";
import { createTestTool, odooRpc, reader, rpcResult, secrets, support } from "./helpers";

// A local MCP client: JSON-RPC over POST /mcp, as Claude would send it.
const rpc = (method: string, params?: unknown) => ({
  method: "POST",
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
});

type Tool = { name: string; description: string; annotations: Record<string, boolean> };

describe("MCP", () => {
  it("lists the tools of the tool, named odoo_<group>_<verb>", async () => {
    const tool = await createTestTool({ as: support, secrets });
    const response = await tool.fetch("/mcp", rpc("tools/list"));
    const { result } = (await response.json()) as { result: { tools: Tool[] } };
    expect(result.tools.map((t) => t.name).sort()).toEqual([
      "odoo_teams_list",
      "odoo_tickets_get",
      "odoo_tickets_list",
      "odoo_tickets_reply",
    ]);
    const replyTool = result.tools.find((t) => t.name === "odoo_tickets_reply");
    expect(replyTool?.annotations).toEqual({ readOnlyHint: false, destructiveHint: true });
  });

  it("only shows a read-only person what they can call", async () => {
    const tool = await createTestTool({ as: reader, secrets });
    const response = await tool.fetch("/mcp", rpc("tools/list"));
    const { result } = (await response.json()) as { result: { tools: Tool[] } };
    expect(result.tools.map((t) => t.name)).not.toContain("odoo_tickets_reply");
  });

  it("calls a tool", async () => {
    const tickets = [{ id: 12, name: "VPN is down" }];
    const tool = await createTestTool({ as: reader, secrets, fetch: odooRpc(rpcResult(tickets)) });
    const response = await tool.fetch(
      "/mcp",
      rpc("tools/call", { name: "odoo_tickets_list", arguments: { limit: 5 } }),
    );
    const { result } = (await response.json()) as {
      result: { content: unknown[]; isError: boolean };
    };
    expect(result.isError).toBe(false);
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify(tickets) }]);
  });

  it("reports an Odoo failure as a tool error, not a protocol error", async () => {
    const tool = await createTestTool({
      as: reader,
      secrets,
      fetch: odooRpc({ error: { data: {} } }),
    });
    const response = await tool.fetch(
      "/mcp",
      rpc("tools/call", { name: "odoo_tickets_list", arguments: {} }),
    );
    const { result } = (await response.json()) as { result: { isError: boolean } };
    expect(result.isError).toBe(true);
  });
});

describe("what the tool does not expose", () => {
  it("has no API: `interfaces` lists MCP and the CLI only", async () => {
    const tool = await createTestTool({ as: reader, secrets, fetch: odooRpc(rpcResult([])) });
    expect((await tool.fetch("/api/tickets.list")).status).toBe(404);
  });
});

describe("CLI", () => {
  it("serves the commands, with the positional arguments of `cli.args`", async () => {
    const tool = await createTestTool({ as: support, secrets });
    const manifest = (await (await tool.fetch("/cli")).json()) as {
      commands: Array<{ path: string[]; args: Array<{ name: string }>; confirm: boolean }>;
    };
    const reply = manifest.commands.find((c) => c.path.join(" ") === "tickets reply");
    expect(reply).toMatchObject({ confirm: true, args: [{ name: "id" }, { name: "message" }] });
    const list = manifest.commands.find((c) => c.path.join(" ") === "tickets list");
    expect(list?.args).toEqual([]);
  });
});
