import { defineConfig, field, kv } from "@forgeron/sdk";

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
    network: { allow: ["*.odoo.com", "odoo.acme.fr"], why: "Calls to the Odoo API" },
    cache: kv(),
  },

  // What each person gives before using the tool: their own Odoo login and API key, asked on the web
  // when they connect, sealed by the platform and never readable by the developer (D-036, D-096).
  setup: {
    fields: {
      ODOO_API_KEY: field.secret({
        label: "Odoo API key",
        help: "Odoo › Preferences › Account Security › New API Key",
        why: "Read and reply to your tickets with your own Odoo permissions",
      }),
      ODOO_LOGIN: field.secret({ label: "Odoo login (email)", why: "Identify you to Odoo" }),
    },
    // Odoo says whether the login and key are good before they are kept (D-101).
    check: "setup.check",
  },

  roles: {
    support: { label: "Support", grants: ["read", "write"] },
    reader: { label: "Read-only", grants: ["read"] },
  },
});
