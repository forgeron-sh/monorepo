import { describe, expect, it } from "vitest";
import { actionAddresses, actionNameOfPath, optionFlag } from "./index";

describe("actionNameOfPath", () => {
  it.each([
    ["deals/move.ts", "deals.move"],
    ["deals\\move.ts", "deals.move"],
    ["ping.ts", "ping"],
    ["tickets/list.tsx", "tickets.list"],
    // Only the extension goes: a dot in a file name is kept.
    ["a.b.ts", "a.b"],
  ])("%s is %s", (path, name) => {
    expect(actionNameOfPath(path)).toBe(name);
  });

  it("rejects more than two levels, naming the file", () => {
    expect(() => actionNameOfPath("deals/won/move.ts")).toThrow(
      "deals/won/move.ts: an action is at most two levels deep (group.verb).",
    );
  });

  it("rejects an empty path", () => {
    expect(() => actionNameOfPath("")).toThrow(/needs a file name/);
  });
});

describe("actionAddresses", () => {
  it("derives the address of each interface from the action name", () => {
    expect(actionAddresses("crm", "deals.move")).toEqual({
      name: "deals.move",
      mcp: "crm_deals_move",
      api: "/t/crm/api/deals.move",
      cli: "forgeron crm deals move",
    });
  });

  it("handles an action at the root of actions/", () => {
    expect(actionAddresses("odoo", "ping")).toMatchObject({
      mcp: "odoo_ping",
      api: "/t/odoo/api/ping",
      cli: "forgeron odoo ping",
    });
  });

  it("keeps the hyphens of a tool name", () => {
    expect(actionAddresses("odoo-gateway", "tickets.list").mcp).toBe("odoo-gateway_tickets_list");
  });
});

describe("optionFlag", () => {
  it.each([
    ["checkBefore", "--check-before"],
    ["limit", "--limit"],
    ["maxResults", "--max-results"],
    ["id2Name", "--id2-name"],
  ])("%s is %s", (field, flag) => {
    expect(optionFlag(field)).toBe(flag);
  });
});
