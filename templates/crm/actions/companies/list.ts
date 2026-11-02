import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists companies, by name, optionally filtered by a text.",
  access: "read",
  input: z.object({
    query: z.string().optional().describe("Part of the name or the domain"),
    limit: z.number().int().max(100).default(20),
  }),
  async run({ input, db }) {
    let query = db
      .selectFrom("companies")
      .select(["id", "name", "domain"])
      .orderBy("name")
      .limit(input.limit);
    if (input.query) {
      const q = `%${input.query}%`;
      query = query.where((eb) => eb.or([eb("name", "like", q), eb("domain", "like", q)]));
    }
    return query.execute();
  },
});
