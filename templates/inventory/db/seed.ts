import { seed } from "@forgeron/sdk/db";

// A few rows to try the tool with: `forgeron db seed`, `createTestTool({ seed: true })`, previews.
export default seed(async ({ db }) => {
  const [nantes, lyon] = await db
    .insertInto("sites")
    .values([
      { name: "Nantes depot", city: "Nantes" },
      { name: "Lyon workshop", city: "Lyon" },
    ])
    .returning("id")
    .execute();
  await db
    .insertInto("equipments")
    .values([
      {
        site_id: nantes!.id,
        ref: "CH-001",
        type: "chiller",
        next_check: "2026-01-15",
        attributes: JSON.stringify({ power_kw: 12.5, refrigerant: "R410A" }),
      },
      {
        site_id: nantes!.id,
        ref: "PU-014",
        type: "pump",
        next_check: "2027-03-01",
        attributes: "{}",
      },
      {
        site_id: lyon!.id,
        ref: "CH-002",
        type: "chiller",
        next_check: "2026-06-30",
        attributes: "{}",
      },
    ])
    .execute();
});
