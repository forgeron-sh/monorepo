import { describe, expect, it } from "vitest";
import { mockConnector, mockFetch, reply } from "@forgeron/sdk/testing";
import { checkConnectorDeclaration } from "@forgeron/sdk";
import { odoo } from "./index";

const instance = { url: "https://odoo.example.test", db: "demo", login: "agent@example.test" };
const endpoint = "POST https://odoo.example.test/jsonrpc";

describe("odoo connector", () => {
  it("calls execute_kw with the db, the login and the token", async () => {
    const fetch = mockFetch({ [endpoint]: { jsonrpc: "2.0", result: [{ id: 1 }] } });
    const client = mockConnector(odoo(instance), { fetch, token: "fake-key" });
    const rows = await client.searchRead("helpdesk.ticket", [["id", "=", 1]], { fields: ["name"] });
    expect(rows).toEqual([{ id: 1 }]);
    const body = fetch.calls[0]!.json() as { params: { args: unknown[] } };
    expect(body.params.args).toEqual([
      "demo",
      "agent@example.test",
      "fake-key",
      "helpdesk.ticket",
      "search_read",
      [[["id", "=", 1]]],
      { fields: ["name"] },
    ]);
  });

  it("turns an Odoo error into UPSTREAM", async () => {
    const fetch = mockFetch({
      [endpoint]: { error: { message: "Odoo Server Error", data: { message: "Access denied" } } },
    });
    const client = mockConnector(odoo(instance), { fetch });
    await expect(client.call("res.partner", "read", [[1]])).rejects.toMatchObject({
      code: "UPSTREAM",
      message: "Access denied",
    });
  });

  it("turns an HTTP failure into UPSTREAM", async () => {
    const client = mockConnector(odoo(instance), { fetch: mockFetch({ [endpoint]: reply(502) }) });
    await expect(client.call("res.partner", "read")).rejects.toMatchObject({ code: "UPSTREAM" });
  });

  it("reaches only its own host", async () => {
    const client = mockConnector(odoo(instance), { fetch: mockFetch({}) });
    await expect(client.fetch("https://other.example.test/")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("supports both modes, has no scopes, and refuses a non-https url", () => {
    const connector = odoo(instance);
    const declaration = { type: "odoo", mode: "application", scopes: [], why: "x" } as const;
    expect(checkConnectorDeclaration(connector, { ...declaration, scopes: [] })).toEqual([]);
    expect(checkConnectorDeclaration(connector, { ...declaration, scopes: ["read"] })).toHaveLength(
      1,
    );
    expect(() => odoo({ ...instance, url: "http://odoo.example.test" })).toThrow(/https/);
  });
});
