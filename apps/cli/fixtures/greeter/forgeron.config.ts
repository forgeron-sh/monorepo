import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "greeter",
  title: "Greeter",
  roles: { reader: { grants: ["read"] } },
});
