import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "views",
  title: "Views",
  description: "A tool with two views.",
  roles: { reader: { grants: ["read"] } },
});
