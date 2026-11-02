import { action, ToolError, z } from "@forgeron/sdk";

export default action({
  description: "Moves a lead to a new pipeline stage.",
  access: "write",
  input: z.object({
    id: z.string(),
    stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]),
  }),
  cli: { args: ["id", "stage"] }, // forgeron crm deals move 01J8… won
  async run({ input, db, user, emit }) {
    const deal = await db
      .selectFrom("deals")
      .selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();
    if (!deal) throw new ToolError("NOT_FOUND", `No lead ${input.id}.`);

    await db.updateTable("deals").set({ stage: input.stage }).where("id", "=", input.id).execute();

    // The history is written by the handler of this event (events/deal-history.ts).
    await emit("deal.moved", {
      dealId: deal.id,
      from: deal.stage,
      to: input.stage,
      by: user.email,
    });
    return { id: deal.id, stage: input.stage };
  },
});
