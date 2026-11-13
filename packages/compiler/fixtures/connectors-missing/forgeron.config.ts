import { connector, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "chatty",
  title: "Chatty",
  description: "Declares a connector nobody built.",
  interfaces: { mcp: true, api: true, cli: true },
  profiles: { reader: { grants: ["read"] } },
  resources: {
    connectors: {
      slack: connector("slack", { mode: "application", scopes: [], why: "Post updates" }),
    },
  },
});
