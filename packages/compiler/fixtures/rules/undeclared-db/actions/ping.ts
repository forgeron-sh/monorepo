import { action, z } from "@forgeron/sdk";

export default action({
  description: "Reads the database.",
  access: "read",
  input: z.object({}),
  // @ts-expect-error `db` is not on the context of a tool without a database
  run: (ctx) => ctx.db.selectFrom("t").execute(),
});
