import { defineConfig, field } from "@forgeron/sdk";

export default defineConfig({
  name: "setup-check",
  setup: { fields: { firstName: field.text({ label: "First name" }) }, check: "setup.check" },
});
