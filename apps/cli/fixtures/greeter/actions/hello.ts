import { action, z } from "@forgeron/sdk";

export default action({
  description: "Says hello.",
  access: "read",
  input: z.object({ name: z.string().default("world") }),
  run: (ctx) => ({ message: `Hello, ${ctx.input.name}!`, as: ctx.user.id }),
});
