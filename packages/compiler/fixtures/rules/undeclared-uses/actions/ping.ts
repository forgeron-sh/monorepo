import { action, z } from "@forgeron/sdk";

export default action({
  description: "Calls a tool it does not use.",
  access: "read",
  input: z.object({}),
  run: (ctx) => ctx.tools.crm?.call("deals.list"),
});
