import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists the deals of a stage.",
  access: "read",
  input: z.object({ stage: z.enum(["lead", "won", "lost"]).default("lead") }),
  async run(ctx) {
    return ctx.db
      .selectFrom("deals")
      .select(["id", "title", "stage"])
      .where("stage", "=", ctx.input.stage)
      .execute();
  },
});
