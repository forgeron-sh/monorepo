import { index, schema, t, table } from "@forgeron/sdk/db";

export const sites = table("sites", {
  id: t.id(),
  name: t.text().notNull().unique(),
  city: t.text().notNull(),
});

export const equipments = table(
  "equipments",
  {
    id: t.id(),
    site_id: t.ref(sites).notNull(),
    ref: t.text().notNull().unique(),
    type: t.text().notNull(),
    next_check: t.date(),
    // Free-form attributes, as JSON text: see lib/attributes.ts.
    attributes: t.json().notNull().default("{}"),
    external_id: t.text().unique(), // identifier of the SharePoint row
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.site_id), index(c.next_check)],
);

export const attachments = table("attachments", {
  id: t.id(),
  equipment_id: t.ref(equipments).onDelete("cascade").notNull(),
  file_key: t.text().notNull(), // key returned by ctx.files.put
  name: t.text().notNull(),
  content_type: t.text().notNull(),
  created_at: t.timestamp().defaultNow(),
});

// One row per import or synchronization, written by events/sync-history.ts.
export const sync_runs = table("sync_runs", {
  id: t.id(),
  source: t.enum(["csv", "sharepoint"]).notNull(),
  items: t.integer().notNull(),
  updated: t.integer().notNull(),
  by_email: t.text().notNull(),
  at: t.timestamp().defaultNow(),
});

export default schema({ sites, equipments, attachments, sync_runs });
