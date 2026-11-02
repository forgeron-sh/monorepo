import { action, z } from "@forgeron/sdk";

// Two writes that must succeed or fail together: one batch (D-012).
export default action({
  description: "Creates a company and a deal for it, atomically.",
  access: "write",
  input: z.object({ name: z.string(), companyId: z.string(), title: z.string() }),
  async run(ctx) {
    await ctx.db.batch([
      ctx.db.insertInto("companies").values({ id: ctx.input.companyId, name: ctx.input.name }),
      ctx.db
        .insertInto("deals")
        .values({ company_id: ctx.input.companyId, title: ctx.input.title }),
    ]);
    return { ok: true };
  },
});
