import { action, ToolError, z } from "@forgeron/sdk";

export default action({
  description: "Moves a deal to another stage.",
  access: "write",
  input: z.object({ id: z.string(), stage: z.enum(["lead", "won", "lost"]) }),
  async run(ctx) {
    const moved = await ctx.db
      .updateTable("deals")
      .set({ stage: ctx.input.stage })
      .where("id", "=", ctx.input.id)
      .returning(["id", "stage"])
      .executeTakeFirst();
    if (!moved) throw new ToolError("NOT_FOUND", `Deal ${ctx.input.id} not found.`);
    return moved;
  },
});
