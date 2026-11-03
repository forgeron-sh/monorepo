import { describe, expect, it, vi } from "vitest";
import { createTestTool, crm, management, NOW, nobody } from "./helpers";

type Summary = {
  since: string;
  won: number;
  totals: Array<{ stage: string; count: number; amount: number }>;
};
type Stale = { days: number; items: Array<{ id: string; owner_email: string }> };

const tool = (as = management, tools: Parameters<typeof createTestTool>[0] = {}) =>
  createTestTool({ as, now: NOW, tools: crm, ...tools });

describe("sales.summary", () => {
  it("counts and adds up leads by stage, every stage present", async () => {
    const result = (await (await tool()).call("sales.summary", {})) as Summary;
    expect(result.totals.map((t) => t.stage)).toEqual([
      "lead",
      "qualified",
      "proposal",
      "negotiation",
      "won",
      "lost",
    ]);
    expect(result.totals.find((t) => t.stage === "lead")).toEqual({
      stage: "lead",
      count: 2,
      amount: 0,
    });
    expect(result.totals.find((t) => t.stage === "won")).toEqual({
      stage: "won",
      count: 2,
      amount: 15_000,
    });
  });

  it("counts as won this month only what was won since the 1st of the month", async () => {
    const result = (await (await tool()).call("sales.summary", {})) as Summary;
    expect(result).toMatchObject({ since: "2026-11-01", won: 10_000 });
    const wider = (await (await tool()).call("sales.summary", { since: "2026-10-01" })) as Summary;
    expect(wider.won).toBe(15_000);
  });

  it("limits to one salesperson by asking the CRM", async () => {
    const list = vi.fn<(input: unknown) => unknown>((input) => crm.crm["deals.list"](input));
    const result = (await (
      await tool(management, { tools: { crm: { "deals.list": list } } })
    ).call("sales.summary", { owner: "sam@acme.fr" })) as Summary;
    expect(list).toHaveBeenCalledWith({ owner: "sam@acme.fr" });
    expect(result.totals.reduce((n, t) => n + t.count, 0)).toBe(1);
  });

  it("fails when the CRM refuses the person, and shows nothing", async () => {
    const refuse = () => {
      throw Object.assign(new Error("No access to deals.list."), { code: "FORBIDDEN" });
    };
    const t = await tool(management, { tools: { crm: { "deals.list": refuse } } });
    await expect(t.call("sales.summary", {})).rejects.toThrow(/No access/);
  });

  it("says so when the CRM does not return updated_at", async () => {
    const t = await tool(management, {
      tools: { crm: { "deals.list": () => [{ id: "1", stage: "won", amount: 1 }] } },
    });
    await expect(t.call("sales.summary", {})).rejects.toMatchObject({ code: "UPSTREAM" });
  });

  it("is refused to a person without the read level", async () => {
    await expect((await tool(nobody)).call("sales.summary", {})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("sales.stale", () => {
  it("lists open leads with no activity for 30 days, the oldest first", async () => {
    const result = (await (await tool()).call("sales.stale", {})) as Stale;
    expect(result.days).toBe(30);
    expect(result.items.map((i) => i.id)).toEqual(["4", "5"]);
  });

  it("takes another number of days and a salesperson", async () => {
    const t = await tool();
    expect(((await t.call("sales.stale", { days: 1 })) as Stale).items.map((i) => i.id)).toEqual([
      "4",
      "5",
      "3",
    ]);
    const sam = (await t.call("sales.stale", { owner: "sam@acme.fr" })) as Stale;
    expect(sam.items.map((i) => i.owner_email)).toEqual(["sam@acme.fr"]);
  });
});

describe("sales.owners", () => {
  it("lists the salespeople who own leads", async () => {
    expect(await (await tool()).call("sales.owners", {})).toEqual(["ely@acme.fr", "sam@acme.fr"]);
  });
});

describe("no data of its own", () => {
  it("has no database: nothing is copied from the CRM", async () => {
    const t = await tool();
    await t.call("sales.summary", {});
    expect(() => t.db).not.toThrow();
    expect(t.db).toBeUndefined();
  });
});
