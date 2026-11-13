import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "dashboard",
  title: "Sales dashboard",
  description: "One page for the Monday meeting, computed from the CRM without copying its data.",

  interfaces: { mcp: true, web: true, cli: true },

  // The dashboard has no data of its own: it calls the actions of the CRM with the person's identity.
  uses: { crm: "^0.0.0" },

  // `management` is specific to this tool: the Monday view needs it, so only the people given this profile see the page.
  profiles: {
    management: { label: "Management", grants: ["read", "management"], default: true },
  },
});
