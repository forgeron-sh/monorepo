import { defineConfig, field } from "@forgeron/sdk";

export default defineConfig({
  name: "setup",
  roles: { reader: { grants: ["read"] } },
  setup: {
    fields: {
      firstName: field.text({ label: "First name" }),
      team: field.choice({ label: "Team", options: ["support", "sales"], required: false }),
      ODOO_API_KEY: field.secret({ label: "Odoo API key", why: "Read your tickets" }),
    },
    check: "setup.check",
  },
});
