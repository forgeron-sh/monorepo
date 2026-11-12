import { database, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "crm",
  title: "CRM",
  description: "Companies, contacts and sales leads of the team.",

  interfaces: { mcp: true, api: true, cli: true, web: true },

  // Access levels used by actions. read, write, delete and admin always exist.
  profiles: {
    sales: { label: "Sales", grants: ["read", "write"] },
    support: { label: "Support", grants: ["read"], default: true },
    management: { label: "Management", grants: ["read", "write", "delete"] },
  },

  resources: {
    db: database({ engine: "d1", why: "Companies, contacts, leads and history" }),
  },
});
