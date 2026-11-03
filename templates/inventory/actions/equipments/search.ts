import { action, z } from "@forgeron/sdk";

export default action({
  description:
    "Searches equipment by city, site, type or check date. Pages of `limit` items: pass `nextCursor` as `cursor` for the next page.",
  access: "read",
  input: z.object({
    city: z.string().optional(),
    site: z.string().optional().describe("Site name"),
    type: z.string().optional(),
    checkBefore: z.string().date().optional().describe("Check due before this date (YYYY-MM-DD)"),
    limit: z.number().int().min(1).max(200).default(50),
    cursor: z.string().optional().describe("`nextCursor` of the previous page"),
  }),
  async run({ input, db }) {
    let query = db
      .selectFrom("equipments")
      .innerJoin("sites", "sites.id", "equipments.site_id")
      .select([
        "equipments.id",
        "equipments.ref",
        "equipments.type",
        "equipments.next_check",
        "sites.name as site",
        "sites.city",
      ])
      .orderBy("equipments.id")
      .limit(input.limit + 1);
    if (input.city) query = query.where("sites.city", "=", input.city);
    if (input.site) query = query.where("sites.name", "=", input.site);
    if (input.type) query = query.where("equipments.type", "=", input.type);
    if (input.checkBefore) query = query.where("equipments.next_check", "<", input.checkBefore);
    if (input.cursor) query = query.where("equipments.id", ">", input.cursor);

    const rows = await query.execute();
    const items = rows.slice(0, input.limit);
    return { items, nextCursor: rows.length > input.limit ? items.at(-1)!.id : null };
  },
});
