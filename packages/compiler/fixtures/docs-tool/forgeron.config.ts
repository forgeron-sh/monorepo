import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "docs-tool",
  title: "Docs tool",
  description: "A tool with a README.",
  icon: "docs/icon.svg",
  profiles: { reader: { grants: ["read"] } },
});
