import { mockFetch, reply } from "@forgeron/sdk/testing";
import { describe, expect, it } from "vitest";
import {
  createTestTool,
  odooRpc,
  reader,
  rpcError,
  rpcResult,
  secrets,
  support,
  userSecrets,
} from "./helpers";

const ticket = { id: 12, name: "VPN is down", stage_id: [2, "In progress"] };

/** The `execute_kw` arguments of the first call: [db, login, key, model, method, args, kwargs]. */
const firstCall = (fetch: ReturnType<typeof odooRpc>) =>
  (fetch.calls[0]!.json() as { params: { args: unknown[] } }).params.args;

describe("tickets.list", () => {
  it("lists my tickets by default, with my own key", async () => {
    const fetch = odooRpc(rpcResult([ticket]));
    const tool = await createTestTool({ as: reader, secrets, fetch });

    expect(await tool.call("tickets.list", {})).toEqual([ticket]);

    const [db, login, key, model, method, args, kwargs] = firstCall(fetch);
    expect([db, login, key, model, method]).toEqual([
      "acme",
      "ely@acme.fr",
      "test-key",
      "helpdesk.ticket",
      "search_read",
    ]);
    expect(args).toEqual([[["user_id.login", "=", "ely@acme.fr"]]]);
    expect(kwargs).toMatchObject({ limit: 20, order: "create_date desc" });
  });

  it("filters by stage, and can leave out `mine`", async () => {
    const fetch = odooRpc(rpcResult([]));
    const tool = await createTestTool({ as: reader, secrets, fetch });
    await tool.call("tickets.list", { mine: false, stage: "In progress", limit: 5 });
    const [, , , , , args, kwargs] = firstCall(fetch);
    expect(args).toEqual([[["stage_id.name", "=", "In progress"]]]);
    expect(kwargs).toMatchObject({ limit: 5 });
  });

  it("refuses a limit above 100", async () => {
    const tool = await createTestTool({ as: reader, secrets, fetch: odooRpc(rpcResult([])) });
    await expect(tool.call("tickets.list", { limit: 500 })).rejects.toMatchObject({
      code: "INVALID",
    });
  });

  it("translates an Odoo denial into FORBIDDEN", async () => {
    const tool = await createTestTool({
      as: reader,
      secrets,
      fetch: odooRpc(rpcError("odoo.exceptions.AccessError", "Access denied")),
    });
    await expect(tool.call("tickets.list", {})).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  });

  it("translates any other Odoo error into UPSTREAM", async () => {
    const tool = await createTestTool({
      as: reader,
      secrets,
      fetch: odooRpc(rpcError("odoo.exceptions.ValidationError", "Bad domain")),
    });
    await expect(tool.call("tickets.list", {})).rejects.toMatchObject({ code: "UPSTREAM" });
  });

  it("translates a failing Odoo server into UPSTREAM", async () => {
    const tool = await createTestTool({
      as: reader,
      secrets,
      fetch: odooRpc(reply(502, "Bad gateway")),
    });
    await expect(tool.call("tickets.list", {})).rejects.toMatchObject({
      code: "UPSTREAM",
      message: "Odoo answered HTTP 502.",
    });
  });
});

describe("configuration", () => {
  it("says which secret is missing, without calling Odoo", async () => {
    const fetch = odooRpc(rpcResult([]));
    const noKey = { ...reader, userSecrets: { ODOO_LOGIN: userSecrets.ODOO_LOGIN } };
    const tool = await createTestTool({ as: noKey, secrets, fetch });
    await expect(tool.call("tickets.list", {})).rejects.toMatchObject({
      code: "INVALID",
      message: expect.stringContaining("ODOO_API_KEY"),
    });
    expect(fetch.calls).toHaveLength(0);
  });

  it("calls only the hosts the tool declared", async () => {
    const elsewhere = { ...secrets, ODOO_URL: "https://evil.example.com" };
    const fetch = odooRpc(rpcResult([]));
    const tool = await createTestTool({ as: reader, secrets: elsewhere, fetch });
    await expect(tool.call("tickets.list", {})).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetch.calls).toHaveLength(0);
  });

  it("accepts the other declared host", async () => {
    const own = { ...secrets, ODOO_URL: "https://odoo.acme.fr" };
    const fetch = mockFetch({
      "POST https://odoo.acme.fr/jsonrpc": rpcResult([ticket]),
    });
    const tool = await createTestTool({ as: reader, secrets: own, fetch });
    expect(await tool.call("tickets.list", {})).toEqual([ticket]);
  });
});

describe("tickets.get", () => {
  it("returns the ticket", async () => {
    const fetch = odooRpc(rpcResult([ticket]));
    const tool = await createTestTool({ as: reader, secrets, fetch });
    expect(await tool.call("tickets.get", { id: 12 })).toEqual(ticket);
    expect(firstCall(fetch)[5]).toEqual([[["id", "=", 12]]]);
  });

  it("answers NOT_FOUND when Odoo returns nothing", async () => {
    const tool = await createTestTool({ as: reader, secrets, fetch: odooRpc(rpcResult([])) });
    await expect(tool.call("tickets.get", { id: 99 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Ticket 99 not found.",
    });
  });
});

describe("tickets.reply", () => {
  it("posts a customer-visible comment", async () => {
    const fetch = odooRpc(rpcResult(true));
    const tool = await createTestTool({ as: support, secrets, fetch });

    expect(await tool.call("tickets.reply", { id: 12, message: "Fixed, thanks." })).toEqual({
      ok: true,
    });

    const [, , , model, method, args, kwargs] = firstCall(fetch);
    expect([model, method, args]).toEqual(["helpdesk.ticket", "message_post", [[12]]]);
    expect(kwargs).toEqual({
      body: "Fixed, thanks.",
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
    });
  });

  it("is refused to a read-only person, before Odoo is called", async () => {
    const fetch = odooRpc(rpcResult(true));
    const tool = await createTestTool({ as: reader, secrets, fetch });
    await expect(tool.call("tickets.reply", { id: 12, message: "Hi" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(fetch.calls).toHaveLength(0);
  });

  it("refuses an empty message", async () => {
    const tool = await createTestTool({ as: support, secrets, fetch: odooRpc(rpcResult(true)) });
    await expect(tool.call("tickets.reply", { id: 12, message: "" })).rejects.toMatchObject({
      code: "INVALID",
    });
  });
});
