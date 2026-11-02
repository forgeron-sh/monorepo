import { action, z } from "@forgeron/sdk";

// ctx.db is only mentioned in a comment.
export default action({
  description: "Uses what it declares.",
  access: "read",
  input: z.object({}),
  run: (ctx) => [ctx.secrets.API_KEY, ctx.cache, ctx.tools.crm],
});
