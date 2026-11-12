import { bucket, database, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "inventory",
  title: "Equipment inventory",
  description:
    "Equipment across sites, fed by CSV imports and a nightly SharePoint synchronization.",

  interfaces: { mcp: true, api: true, cli: true },

  // `import` is specific to this tool: citing it in a role is enough for it to exist.
  profiles: {
    technician: { label: "Technician", grants: ["read", "write"] },
    reader: { label: "Reader", grants: ["read"], default: true },
    admin: { label: "Administrator", grants: ["read", "write", "delete", "import"] },
  },

  resources: {
    db: database({
      engine: "d1",
      why: "Sites, equipment, attachments and synchronization history",
    }),
    files: bucket({
      maxSize: "25MB",
      types: ["application/pdf", "image/*", "text/csv"],
      why: "Datasheets and photos attached to equipment",
    }),
    secrets: {
      SHAREPOINT_TOKEN: { why: "Bearer token to read the SharePoint equipment list every night" },
    },
    network: {
      allow: ["graph.microsoft.com"],
      why: "Read the SharePoint equipment list through Microsoft Graph",
    },
  },
});
