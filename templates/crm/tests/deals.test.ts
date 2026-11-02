import { describe, expect, it } from "vitest";
import { aLead, createTestTool, management, sales, support } from "./helpers";

type History = Array<{ from_stage: string | null; to_stage: string; by_email: string }>;
const history = (tool: Awaited<ReturnType<typeof createTestTool>>) =>
  tool.db
    .selectFrom("deal_events")
    .select(["from_stage", "to_stage", "by_email"])
    .orderBy("at")
    .execute() as Promise<History>;

describe("deals.create and deals.list", () => {
  it("creates a lead in the first stage, owned by the person who made it", async () => {
    const tool = await createTestTool({ as: sales });
    const { company } = await aLead(tool);
    const deals = (await tool.call("deals.list", {})) as Array<Record<string, unknown>>;
    expect(deals).toEqual([
      {
        id: expect.any(String),
        title: "Renewal",
        stage: "lead",
        amount: null,
        owner_email: "ely@acme.fr",
        company: "Acme",
      },
    ]);
    expect(company).toMatch(/^[0-9a-f]{32}$/);
  });

  it("keeps the amount in cents", async () => {
    const tool = await createTestTool({ as: sales });
    const { company } = await aLead(tool);
    await tool.call("deals.create", { company_id: company, title: "Big", amount: 120000 });
    const big = (
      (await tool.call("deals.list", {})) as Array<{ title: string; amount: number }>
    ).find((d) => d.title === "Big");
    expect(big?.amount).toBe(120000);
  });

  it("filters by stage and by owner", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    await tool.call("deals.move", { id: deal, stage: "won" });
    await tool
      .as({ email: "other@acme.fr", roles: ["sales"] })
      .call("deals.create", { company_id: (await aLead(tool, "Other")).company, title: "Theirs" });

    const stages = (await tool.call("deals.list", { stage: "won" })) as Array<{ title: string }>;
    expect(stages.map((d) => d.title)).toEqual(["Renewal"]);
    const owned = (await tool.call("deals.list", { owner: "other@acme.fr" })) as Array<{
      title: string;
    }>;
    expect(owned.map((d) => d.title)).toEqual(["Theirs"]);
  });

  it("refuses a lead for a company that does not exist", async () => {
    const tool = await createTestTool({ as: sales });
    await expect(tool.call("deals.create", { company_id: "nobody", title: "x" })).rejects.toThrow(
      /FOREIGN KEY/,
    );
  });
});

describe("deals.move", () => {
  it("moves a lead and keeps the history: who, from, to", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    expect(await tool.call("deals.move", { id: deal, stage: "qualified" })).toEqual({
      id: deal,
      stage: "qualified",
    });
    expect(await history(tool)).toEqual([
      { from_stage: "lead", to_stage: "qualified", by_email: "ely@acme.fr" },
    ]);
  });

  it("records every move, in order, by whoever made it", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    await tool.call("deals.move", { id: deal, stage: "proposal" });
    await tool
      .as({ email: "lou@acme.fr", roles: ["sales"] })
      .call("deals.move", { id: deal, stage: "won" });
    expect(await history(tool)).toEqual([
      { from_stage: "lead", to_stage: "proposal", by_email: "ely@acme.fr" },
      { from_stage: "proposal", to_stage: "won", by_email: "lou@acme.fr" },
    ]);
  });

  it("emits deal.moved, with what the handler needs", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    await tool.call("deals.move", { id: deal, stage: "won" });
    expect(tool.events).toEqual([
      {
        event: "deal.moved",
        payload: { dealId: deal, from: "lead", to: "won", by: "ely@acme.fr" },
      },
    ]);
  });

  it("updates the time of the lead", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    await tool.db
      .updateTable("deals")
      .set({ updated_at: "2000-01-01T00:00:00.000Z" })
      .where("id", "=", deal)
      .execute();
    await tool.call("deals.move", { id: deal, stage: "won" });
    const row = await tool.db
      .selectFrom("deals")
      .select("updated_at")
      .where("id", "=", deal)
      .executeTakeFirstOrThrow();
    expect(row.updated_at > "2000-01-01T00:00:00.000Z").toBe(true);
  });

  it("answers NOT_FOUND for a lead that does not exist, and records nothing", async () => {
    const tool = await createTestTool({ as: sales });
    await expect(tool.call("deals.move", { id: "nope", stage: "won" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(tool.events).toEqual([]);
    expect(await history(tool)).toEqual([]);
  });

  it("refuses a stage that is not in the pipeline, before touching the database", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    await expect(tool.call("deals.move", { id: deal, stage: "open" })).rejects.toMatchObject({
      code: "INVALID",
    });
    expect(await history(tool)).toEqual([]);
  });
});

describe("deals.delete", () => {
  it("deletes a lead and its history", async () => {
    const tool = await createTestTool({ as: management });
    const { deal } = await aLead(tool);
    await tool.call("deals.move", { id: deal, stage: "won" });
    expect(await history(tool)).toHaveLength(1);

    expect(await tool.call("deals.delete", { id: deal })).toEqual({ deleted: deal });
    expect(await tool.call("deals.list", {})).toEqual([]);
    expect(await history(tool)).toEqual([]);
  });

  it("answers NOT_FOUND for a lead that does not exist", async () => {
    const tool = await createTestTool({ as: management });
    await expect(tool.call("deals.delete", { id: "nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("the three roles", () => {
  it("sales read and write, and cannot delete", async () => {
    const tool = await createTestTool({ as: sales });
    const { deal } = await aLead(tool);
    await tool.call("deals.move", { id: deal, stage: "won" });
    await expect(tool.call("deals.delete", { id: deal })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("support read only: a lead is theirs to see, never to move or create", async () => {
    const tool = await createTestTool({ as: sales });
    const { company, deal } = await aLead(tool);
    const reader = tool.as(support);
    expect(await reader.call("deals.list", {})).toHaveLength(1);
    await expect(reader.call("deals.move", { id: deal, stage: "won" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      reader.call("deals.create", { company_id: company, title: "x" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(reader.call("deals.delete", { id: deal })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await history(tool)).toEqual([]);
  });

  it("management read, write and delete", async () => {
    const tool = await createTestTool({ as: management });
    const { deal } = await aLead(tool);
    expect(await tool.call("deals.move", { id: deal, stage: "lost" })).toEqual({
      id: deal,
      stage: "lost",
    });
    expect(await tool.call("deals.delete", { id: deal })).toEqual({ deleted: deal });
  });

  it("a person with no role can do nothing", async () => {
    const tool = await createTestTool({ as: { roles: [] } });
    await expect(tool.call("deals.list", {})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
