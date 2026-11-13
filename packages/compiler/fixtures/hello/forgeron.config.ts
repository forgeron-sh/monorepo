import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "hello",
  title: "Hello",
  description: "A tool of a few files.",
  interfaces: { mcp: true, api: true, cli: true },
  profiles: {
    reader: { grants: ["read"] },
    support: { grants: ["read", "write"] },
  },
  resources: {
    network: { allow: ["api.example.com"], why: "Example API" },
  },
});
