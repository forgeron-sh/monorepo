import { connector, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "inbox",
  title: "Inbox",
  description: "Reads the caller's own mail and calendar.",
  interfaces: { mcp: true, api: true, cli: true },
  profiles: { reader: { grants: ["read"] } },
  resources: {
    connectors: {
      google: connector("google-workspace", {
        mode: "delegated",
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
        why: "Read your Gmail",
      }),
      microsoft: connector("microsoft-365", {
        mode: "delegated",
        scopes: ["User.Read"],
        why: "Read your Microsoft profile",
      }),
    },
  },
});
