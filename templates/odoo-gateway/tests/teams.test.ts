import { describe, expect, it } from "vitest";
import { createTestTool, odooRpc, reader, rpcResult, secrets } from "./helpers";

const teams = [
  { id: 1, name: "Support" },
  { id: 2, name: "Sales" },
];

describe("teams.list", () => {
  it("lists the teams", async () => {
    const tool = await createTestTool({ as: reader, secrets, fetch: odooRpc(rpcResult(teams)) });
    expect(await tool.call("teams.list", {})).toEqual(teams);
  });

  it("asks Odoo once, and shares the answer between people", async () => {
    const fetch = odooRpc(rpcResult(teams));
    const tool = await createTestTool({ as: reader, secrets, fetch });
    await tool.call("teams.list", {});
    await tool.call("teams.list", {});
    await tool.as({ email: "someone.else@acme.fr" }).call("teams.list", {});
    expect(fetch.calls).toHaveLength(1);
  });
});
