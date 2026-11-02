import { index, schema, t, table } from "@forgeron/sdk/db";

export const companies = table("companies", {
  id: t.id(),
  name: t.text().notNull(),
  created_at: t.timestamp().defaultNow(),
});

export const deals = table(
  "deals",
  {
    id: t.id(),
    company_id: t.ref(companies).onDelete("cascade").notNull(),
    title: t.text().notNull(),
    stage: t.enum(["lead", "won", "lost"]).default("lead"),
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.stage)],
);

export default schema({ companies, deals });
