import type { Manifest } from "./schema";

// The crm example of sdk.md §3, as the compiler would write it.
export const crm: Manifest = {
  name: "crm",
  version: "1.4.0",
  title: "CRM",
  description: "Companies, contacts and leads.",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  roles: {
    commercial: { label: "Sales", grants: ["read", "write"] },
    direction: { label: "Management", grants: ["read", "write", "delete"] },
  },
  actions: {
    "deals.move": {
      description: "Moves a lead to a new stage.",
      access: "write",
      input: {
        type: "object",
        properties: { id: { type: "string" }, stage: { enum: ["won", "lost"] } },
        required: ["id", "stage"],
      },
      output: { type: "object" },
      confirm: false,
      cli: { args: ["id", "stage"] },
      http: { method: "POST" },
      interfaces: ["mcp", "api", "cli", "web"],
      rateLimit: { per: "user", max: 60, window: "1m" },
    },
  },
  views: {
    pipeline: { title: "Pipeline", path: "/pipeline", access: "read" },
  },
  jobs: {
    "monday-summary": { cron: "0 7 * * 1", timezone: "Europe/Paris" },
  },
  resources: {
    db: { engine: "d1", why: "Companies, contacts and leads" },
    files: { maxSize: "25MB", types: ["application/pdf", "image/*"], why: "Lead attachments" },
    cache: {},
    queue: { why: "Sending summaries" },
    secrets: { HUBSPOT_KEY: { why: "One-off import from HubSpot" } },
    userSecrets: {
      ODOO_API_KEY: { label: "Odoo API key", help: "Profile > Security", why: "Read your tickets" },
    },
    connectors: {
      microsoft: {
        type: "microsoft-365",
        mode: "delegated",
        scopes: ["Mail.Send"],
        why: "Send an email to a contact",
      },
    },
    network: { allow: ["api.hubspot.com"], why: "HubSpot API" },
  },
  uses: { contacts: "^2.0.0" },
  preview: { data: "seed" },
};

export const minimal: Manifest = {
  name: "odoo-gateway",
  version: "0.1.0",
  interfaces: { mcp: true, api: true, cli: true, web: false },
  roles: {},
  actions: {},
  views: {},
  jobs: {},
  resources: {},
  uses: {},
  preview: { data: "seed" },
};

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
