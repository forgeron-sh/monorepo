import { describe, expect, it } from "vitest";
import { createTestTool, odooRpc, reader, rpcError, rpcResult, secrets } from "./helpers";

describe("setup.check", () => {
  it("accepts a login and key that Odoo accepts, and asks Odoo with them", async () => {
    const fetch = odooRpc(rpcResult(3));
    const tool = await createTestTool({ as: reader, secrets, fetch });
    expect(await tool.call("setup.check", {})).toEqual({});
    const sent = fetch.calls[0]!.json() as { params: { args: unknown[] } };
    expect(sent.params.args.slice(0, 3)).toEqual(["acme", "ely@acme.fr", "test-key"]);
  });

  it("says the key is wrong, on the key's field, when Odoo refuses it", async () => {
    const tool = await createTestTool({
      as: reader,
      secrets,
      fetch: odooRpc(rpcError("odoo.exceptions.AccessDenied", "Access Denied")),
    });
    expect(await tool.call("setup.check", {})).toEqual({
      errors: { ODOO_API_KEY: "Odoo refused this login and API key." },
    });
  });

  it("lets another failure through (Odoo is down is not a wrong key)", async () => {
    const tool = await createTestTool({
      as: reader,
      secrets,
      fetch: odooRpc(rpcError("odoo.exceptions.UserError", "Server error")),
    });
    await expect(tool.call("setup.check", {})).rejects.toMatchObject({ code: "UPSTREAM" });
  });
});
