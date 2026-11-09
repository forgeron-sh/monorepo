import { defineConfig, field } from "@forgeron/sdk";

export default defineConfig({
  name: "setup-clash",
  resources: { userSecrets: { ODOO_API_KEY: { label: "Odoo API key", why: "Read" } } },
  setup: { fields: { ODOO_API_KEY: field.secret({ label: "Odoo API key", why: "Read" }) } },
});
