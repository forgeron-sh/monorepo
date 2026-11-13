import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "greeter",
  title: "Greeter",
  profiles: { reader: { grants: ["read"] }, nobody: { grants: [] } },
});
