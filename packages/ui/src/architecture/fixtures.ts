import type { Manifest } from "@forgeron/manifest";

// The manifests `forgeron build` writes for the templates in `templates/`, plus an Odoo gateway (a tool
// without a database, kept here as a fixture since it left `templates/`, D-114), with the JSON Schemas
// of the action inputs cut down to `{ type: "object" }`: the diagram reads names, access levels,
// interfaces and resources, never the schemas. Used by the design system preview and the tests.

export const crm: Manifest = {
  name: "crm",
  version: "0.0.0",
  title: "CRM",
  description: "Companies, contacts and sales leads of the team.",
  interfaces: {
    mcp: true,
    api: true,
    cli: true,
    web: true,
  },
  profiles: {
    sales: {
      label: "Sales",
      grants: ["read", "write"],
    },
    support: {
      label: "Support",
      grants: ["read"],
    },
    management: {
      label: "Management",
      grants: ["read", "write", "delete"],
    },
  },
  actions: {
    "companies.list": {
      description: "Lists companies, by name, optionally filtered by a text.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "companies.upsert": {
      description: "Creates a company, or updates the one that has the same domain.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "contacts.create": {
      description: "Creates a contact, optionally attached to a company.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "contacts.search": {
      description: "Searches contacts by last name, first name, email or company.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: ["query"],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "contacts.update": {
      description: "Updates the details of a contact: only what is given changes.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: ["id"],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "deals.create": {
      description: "Creates a lead for a company, in the first stage.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "deals.delete": {
      description: "Permanently deletes a lead and its history.",
      access: "delete",
      input: {
        type: "object",
      },
      confirm: true,
      cli: {
        args: ["id"],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "deals.list": {
      description: "Lists leads with their company, optionally of one stage or one owner.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
    "deals.move": {
      description: "Moves a lead to a new pipeline stage.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: ["id", "stage"],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli", "web"],
    },
  },
  views: {},
  jobs: {},
  events: {
    "deal-history": {
      event: "deal.moved",
      mode: "sync",
    },
  },
  resources: {
    db: {
      engine: "d1",
      why: "Companies, contacts, leads and history",
    },
  },
  uses: {},
  preview: {
    data: "seed",
  },
};

export const dashboard: Manifest = {
  name: "dashboard",
  version: "0.0.0",
  title: "Sales dashboard",
  description: "One page for the Monday meeting, computed from the CRM without copying its data.",
  interfaces: {
    mcp: true,
    api: false,
    cli: true,
    web: true,
  },
  profiles: {
    management: {
      label: "Management",
      grants: ["read", "management"],
    },
  },
  actions: {
    "sales.owners": {
      description: "The salespeople who own at least one lead, for the filter of the dashboard.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "cli", "web"],
    },
    "sales.stale": {
      description: "Open leads with no activity for a number of days, the oldest first.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "cli", "web"],
    },
    "sales.summary": {
      description: "Number and amount of leads by stage, and the amount won since a date.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "cli", "web"],
    },
  },
  views: {
    monday: {
      title: "Monday meeting",
      path: "/monday",
      access: "management",
      params: {
        type: "object",
        properties: {
          owner: {
            type: "string",
            format: "email",
            pattern:
              "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
          },
        },
      },
      entry: "views/monday.js",
    },
  },
  jobs: {},
  events: {},
  resources: {},
  uses: {
    crm: "^0.0.0",
  },
  preview: {
    data: "seed",
  },
};

export const inventory: Manifest = {
  name: "inventory",
  version: "0.0.0",
  title: "Equipment inventory",
  description:
    "Equipment across sites, fed by CSV imports and a nightly SharePoint synchronization.",
  interfaces: {
    mcp: true,
    api: true,
    cli: true,
    web: false,
  },
  profiles: {
    technician: {
      label: "Technician",
      grants: ["read", "write"],
    },
    reader: {
      label: "Reader",
      grants: ["read"],
    },
    admin: {
      label: "Administrator",
      grants: ["read", "write", "delete", "import"],
    },
  },
  actions: {
    "equipments.attach": {
      description:
        "Attaches a file (PDF or image, up to 25 MB) to a piece of equipment. The content is given base64-encoded.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "equipments.get": {
      description:
        "Gets a piece of equipment by id or by ref, with its attributes and attachments.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "equipments.import": {
      description:
        "Imports or updates equipment from CSV text (header line, then columns ref, type, site, next_check; any other column becomes an attribute). Rows are matched on ref. `dryRun` defaults to true: it only reports what would change.",
      access: "import",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: ["csv"],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "equipments.search": {
      description:
        "Searches equipment by city, site, type or check date. Pages of `limit` items: pass `nextCursor` as `cursor` for the next page.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "equipments.set-attributes": {
      description:
        "Sets free-form attributes of a piece of equipment (power_kw, refrigerant, serial or any other key). Keys given are merged into the existing ones; `null` removes a key.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "sites.create": {
      description: "Creates a site, or updates the city of the one that has the same name.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "sites.list": {
      description: "Lists the sites, by name, optionally of one city.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli"],
    },
    "sync-runs.list": {
      description: "Lists the latest imports and synchronizations, most recent first.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "api", "cli"],
    },
  },
  views: {},
  jobs: {
    "sync-sharepoint": {
      cron: "0 2 * * *",
      timezone: "Europe/Paris",
    },
  },
  events: {
    "sync-history": {
      event: "inventory.synced",
      mode: "sync",
    },
  },
  resources: {
    db: {
      engine: "d1",
      why: "Sites, equipment, attachments and synchronization history",
    },
    files: {
      maxSize: "25MB",
      types: ["application/pdf", "image/*", "text/csv"],
      why: "Datasheets and photos attached to equipment",
    },
    secrets: {
      SHAREPOINT_TOKEN: {
        why: "Bearer token to read the SharePoint equipment list every night",
      },
    },
    network: {
      allow: ["graph.microsoft.com"],
      why: "Read the SharePoint equipment list through Microsoft Graph",
    },
  },
  uses: {},
  preview: {
    data: "seed",
  },
};

export const odooGateway: Manifest = {
  name: "odoo",
  version: "0.0.0",
  title: "Odoo gateway",
  description: "Odoo support tickets, with each person's own permissions.",
  interfaces: {
    mcp: true,
    api: false,
    cli: true,
    web: false,
  },
  profiles: {
    support: {
      label: "Support",
      grants: ["read", "write"],
    },
    reader: {
      label: "Read-only",
      grants: ["read"],
    },
  },
  actions: {
    "teams.list": {
      description: "Lists the Odoo support teams.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "cli"],
    },
    "tickets.get": {
      description: "Gets one Odoo support ticket by its number.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: ["id"],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "cli"],
    },
    "tickets.list": {
      description: "Lists Odoo support tickets, by default those assigned to me.",
      access: "read",
      input: {
        type: "object",
      },
      confirm: false,
      cli: {
        args: [],
      },
      http: {
        method: "GET",
      },
      interfaces: ["mcp", "cli"],
    },
    "tickets.reply": {
      description: "Adds a customer-visible reply to a ticket.",
      access: "write",
      input: {
        type: "object",
      },
      confirm: true,
      cli: {
        args: ["id", "message"],
      },
      http: {
        method: "POST",
      },
      interfaces: ["mcp", "cli"],
    },
  },
  views: {},
  jobs: {},
  events: {},
  resources: {
    cache: {},
    secrets: {
      ODOO_URL: {
        why: "Address of the Odoo instance",
      },
      ODOO_DB: {
        why: "Name of the Odoo database",
      },
    },
    userSecrets: {
      ODOO_API_KEY: {
        label: "Odoo API key",
        help: "Odoo \u203a Preferences \u203a Account Security \u203a New API Key",
        why: "Read and reply to your tickets with your own Odoo permissions",
      },
      ODOO_LOGIN: {
        label: "Odoo login (email)",
        why: "Identify you to Odoo",
      },
    },
    network: {
      allow: ["*.odoo.com", "odoo.acme.fr"],
      why: "Calls to the Odoo API",
    },
  },
  uses: {},
  preview: {
    data: "seed",
  },
};

export const templateManifests = { crm, dashboard, inventory, odooGateway } as const;
