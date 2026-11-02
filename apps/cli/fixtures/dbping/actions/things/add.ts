import { action, z } from "@forgeron/sdk";

export default action({
  description: "Adds a thing.",
  access: "read",
  input: z.object({ name: z.string() }),
  run: (ctx) =>
    ctx.db
      .insertInto("things")
      .values({ name: ctx.input.name })
      .returning("name")
      .executeTakeFirstOrThrow(),
});
