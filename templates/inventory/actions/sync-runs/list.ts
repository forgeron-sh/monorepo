import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists the latest imports and synchronizations, most recent first.",
  access: "read",
  input: z.object({ limit: z.number().int().min(1).max(100).default(20) }),
  async run({ input, db }) {
    return db
      .selectFrom("sync_runs")
      .select(["id", "source", "items", "updated", "by_email", "at"])
      .orderBy("id", "desc")
      .limit(input.limit)
      .execute();
  },
});
