import { schedule } from "@forgeron/sdk";
import { readList } from "../lib/sharepoint";

export default schedule("0 2 * * *", { timezone: "Europe/Paris" }, async (ctx) => {
  const token = ctx.secrets.SHAREPOINT_TOKEN;
  if (!token) throw new Error("The secret SHAREPOINT_TOKEN is not set.");
  const items = await readList(ctx.fetch, token);

  let updated = 0;
  let unmatched = 0;
  for (const item of items) {
    const nextCheck = item.fields.NextCheck?.slice(0, 10) ?? null;
    // Already linked rows are found by external_id; the others are linked through their ref.
    let row = await ctx.db
      .selectFrom("equipments")
      .select("id")
      .where("external_id", "=", item.id)
      .executeTakeFirst();
    if (!row && item.fields.Ref) {
      row = await ctx.db
        .selectFrom("equipments")
        .select("id")
        .where("ref", "=", item.fields.Ref)
        .where("external_id", "is", null)
        .executeTakeFirst();
    }
    if (!row) {
      unmatched++;
      continue;
    }
    await ctx.db
      .updateTable("equipments")
      .set({ next_check: nextCheck, external_id: item.id })
      .where("id", "=", row.id)
      .execute();
    updated++;
  }
  ctx.log.info("SharePoint sync", { items: items.length, updated, unmatched });
  await ctx.emit("inventory.synced", {
    source: "sharepoint",
    items: items.length,
    updated,
    by: ctx.user.email || ctx.user.id,
  });
});
