import { defineConfig, kv } from "@forgeron/sdk";

export default defineConfig({
  name: "odoo",
  title: "Odoo gateway",
  description: "Odoo support tickets, with each person's own permissions.",

  interfaces: { mcp: true, cli: true },

  resources: {
    // Tool secrets: set by the admin (forgeron secrets set ODOO_URL)
    secrets: {
      ODOO_URL: { why: "Address of the Odoo instance" },
      ODOO_DB: { why: "Name of the Odoo database" },
    },
    // Per-person secrets: requested from each person on first use
    userSecrets: {
      ODOO_API_KEY: {
        label: "Odoo API key",
        help: "Odoo › Preferences › Account Security › New API Key",
        why: "Read and reply to your tickets with your own Odoo permissions",
      },
      ODOO_LOGIN: { label: "Odoo login (email)", why: "Identify you to Odoo" },
    },
    network: { allow: ["*.odoo.com", "odoo.acme.fr"], why: "Calls to the Odoo API" },
    cache: kv(),
  },

  roles: {
    support: { label: "Support", grants: ["read", "write"] },
    reader: { label: "Read-only", grants: ["read"] },
  },
});
