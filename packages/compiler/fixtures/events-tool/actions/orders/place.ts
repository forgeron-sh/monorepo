import { action, z } from "@forgeron/sdk";

export default action({
  description: "Places an order.",
  access: "write",
  input: z.object({ id: z.number().default(1) }),
  async run(ctx) {
    await ctx.emit("order.placed", { id: ctx.input.id });
    return { placed: ctx.input.id };
  },
});
