import { action, z } from "@forgeron/sdk";
import { sql } from "@forgeron/sdk/db";

// Asks the database a question that needs no table: proves the Worker was given its D1 binding.
export default action({
  description: "Asks the database for 1.",
  access: "read",
  input: z.object({}),
  async run(ctx) {
    const { rows } = await sql<{ one: number }>`SELECT 1 AS one`.execute(ctx.db);
    return { one: rows[0]?.one };
  },
});
