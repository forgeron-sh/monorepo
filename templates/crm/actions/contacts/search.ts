import { action, z } from "@forgeron/sdk";

export default action({
  description: "Searches contacts by last name, first name, email or company.",
  access: "read",
  input: z.object({
    query: z.string().min(2).describe("Text to search for"),
    limit: z.number().int().max(50).default(10),
  }),
  cli: { args: ["query"] }, // forgeron crm contacts search "Durand"
  async run({ input, db }) {
    const q = `%${input.query}%`;
    return db
      .selectFrom("contacts")
      .leftJoin("companies", "companies.id", "contacts.company_id")
      .select([
        "contacts.id",
        "contacts.first_name",
        "contacts.last_name",
        "contacts.email",
        "companies.name as company",
      ])
      .where((eb) =>
        eb.or([
          eb("contacts.last_name", "like", q),
          eb("contacts.first_name", "like", q),
          eb("contacts.email", "like", q),
          eb("companies.name", "like", q),
        ]),
      )
      .limit(input.limit)
      .execute();
  },
});
