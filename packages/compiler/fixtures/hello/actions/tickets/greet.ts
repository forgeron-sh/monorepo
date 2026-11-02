import { action, z } from "@forgeron/sdk";
import { greet } from "../../lib/greet";

export default action({
  description: "Greets someone.",
  access: "read",
  input: z.object({ name: z.string().describe("Who to greet"), loud: z.boolean().default(false) }),
  output: z.object({ message: z.string() }),
  run: (ctx) => ({
    message: ctx.input.loud ? greet(ctx.input.name).toUpperCase() : greet(ctx.input.name),
  }),
});
