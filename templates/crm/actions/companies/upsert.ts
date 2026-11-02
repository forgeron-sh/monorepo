import { action, z } from "@forgeron/sdk";

export default action({
  description: "Creates a company, or updates the one that has the same domain.",
  access: "write",
  input: z.object({
    name: z.string().min(1),
    domain: z.string().min(3).optional().describe("Its web domain: companies are matched on it"),
  }),
  async run({ input, db }) {
    const insert = db
      .insertInto("companies")
      .values({ name: input.name, domain: input.domain ?? null });
    // Without a domain there is nothing to match on: it is a new company.
    const query = input.domain
      ? insert.onConflict((conflict) => conflict.column("domain").doUpdateSet({ name: input.name }))
      : insert;
    return query.returning(["id", "name", "domain"]).executeTakeFirstOrThrow();
  },
});
