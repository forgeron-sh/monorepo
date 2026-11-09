import { action, z } from "@forgeron/sdk";

export default action({
  description: "What the person gave the tool's setup.",
  access: "read",
  input: z.object({}),
  run: (ctx) => ({ setup: ctx.user.setup }),
});
