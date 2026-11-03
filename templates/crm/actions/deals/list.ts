import { action, z } from "@forgeron/sdk";

export default action({
  description: "Lists leads with their company, optionally of one stage or one owner.",
  access: "read",
  input: z.object({
    stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
    owner: z.string().optional().describe("The email of the person in charge"),
  }),
  async run({ input, db }) {
    let query = db
      .selectFrom("deals")
      .innerJoin("companies", "companies.id", "deals.company_id")
      .select([
        "deals.id",
        "deals.title",
        "deals.stage",
        "deals.amount",
        "deals.owner_email",
        "companies.name as company",
      ])
      .orderBy("deals.updated_at", "desc");
    if (input.stage) query = query.where("deals.stage", "=", input.stage);
    if (input.owner) query = query.where("deals.owner_email", "=", input.owner);
    return query.execute();
  },
});
