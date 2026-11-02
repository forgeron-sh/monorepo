import { action, z } from "@forgeron/sdk";

export default action({
  description: "Creates a lead for a company, in the first stage.",
  access: "write",
  input: z.object({
    company_id: z.string(),
    title: z.string().min(1),
    amount: z.number().int().nonnegative().optional().describe("In cents"),
  }),
  async run({ input, db, user }) {
    return db
      .insertInto("deals")
      .values({
        company_id: input.company_id,
        title: input.title,
        amount: input.amount ?? null,
        owner_email: user.email,
      })
      .returning(["id", "title", "stage"])
      .executeTakeFirstOrThrow();
  },
});
