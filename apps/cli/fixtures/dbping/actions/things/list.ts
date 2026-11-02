import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists the things.",
  access: "read",
  input: z.object({}),
  run: (ctx) => ctx.db.selectFrom("things").select("name").orderBy("name").execute(),
});
