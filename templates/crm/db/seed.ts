import { seed } from "@forgeron/sdk/db";

// A few rows to try the tool with: `forgeron db seed`, `createTestTool({ seed: true })`, previews.
export default seed(async ({ db }) => {
  const [acme, globex] = await db
    .insertInto("companies")
    .values([
      { name: "Acme", domain: "acme.fr" },
      { name: "Globex", domain: "globex.com" },
    ])
    .returning("id")
    .execute();
  await db
    .insertInto("deals")
    .values([
      { company_id: acme!.id, owner_email: "ely@acme.fr", title: "Renewal", stage: "proposal" },
      { company_id: globex!.id, owner_email: "ely@acme.fr", title: "Pilot", stage: "lead" },
    ])
    .execute();
});
