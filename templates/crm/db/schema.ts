import { index, schema, t, table } from "@forgeron/sdk/db";

export const companies = table("companies", {
  id: t.id(),
  name: t.text().notNull(),
  domain: t.text().unique(),
  created_at: t.timestamp().defaultNow(),
});

export const contacts = table(
  "contacts",
  {
    id: t.id(),
    company_id: t.ref(companies).onDelete("set null"),
    first_name: t.text().notNull(),
    last_name: t.text().notNull(),
    email: t.text().unique(),
    phone: t.text(),
    created_at: t.timestamp().defaultNow(),
  },
  (c) => [index(c.last_name)],
);

export const deals = table(
  "deals",
  {
    id: t.id(),
    company_id: t.ref(companies).notNull(),
    owner_email: t.text().notNull(),
    title: t.text().notNull(),
    stage: t.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).default("lead"),
    amount: t.integer(), // in cents
    updated_at: t.timestamp().defaultNow().onUpdateNow(),
  },
  (c) => [index(c.stage), index(c.owner_email)],
);

export const deal_events = table("deal_events", {
  id: t.id(),
  deal_id: t.ref(deals).onDelete("cascade").notNull(),
  from_stage: t.text(),
  to_stage: t.text().notNull(),
  by_email: t.text().notNull(),
  at: t.timestamp().defaultNow(),
});

export default schema({ companies, contacts, deals, deal_events });
