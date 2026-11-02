import { action, z } from "@forgeron/sdk";

export default action({
  description: "Creates a deal, and its company if it does not exist.",
  access: "write",
  input: z.object({ company: z.string(), title: z.string() }),
  async run(ctx) {
    const company = await ctx.db
      .insertInto("companies")
      .values({ name: ctx.input.company })
      .returning("id")
      .executeTakeFirstOrThrow();
    return ctx.db
      .insertInto("deals")
      .values({ company_id: company.id, title: ctx.input.title })
      .returning(["id", "stage"])
      .executeTakeFirstOrThrow();
  },
});
