import { action, ToolError, z } from "@forgeron/sdk";

export default action({
  description: "Permanently deletes a lead and its history.",
  access: "delete",
  confirm: true, // MCP: flagged destructive; CLI: asks for confirmation
  input: z.object({ id: z.string() }),
  cli: { args: ["id"] },
  async run({ input, db }) {
    // Its history goes with it: `deal_events.deal_id` cascades.
    const deleted = await db
      .deleteFrom("deals")
      .where("id", "=", input.id)
      .returning("id")
      .executeTakeFirst();
    if (!deleted) throw new ToolError("NOT_FOUND", `No lead ${input.id}.`);
    return { deleted: input.id };
  },
});
