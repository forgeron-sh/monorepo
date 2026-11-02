import { describe, expect, it } from "vitest";
import { ManifestSchema, type Manifest } from "./index";

// The crm example of sdk.md §3, as the compiler would write it.
const crm: Manifest = {
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

const minimal: Manifest = {
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

function withAction(patch: Record<string, unknown>) {
  const { "deals.move": base } = crm.actions;
  return { ...crm, actions: { "deals.move": { ...base, ...patch } } };
}

describe("ManifestSchema", () => {
  it("accepts the crm example", () => {
    expect(ManifestSchema.parse(crm)).toEqual(crm);
  });

  it("accepts a tool with no action, view, job or resource", () => {
    expect(ManifestSchema.parse(minimal)).toEqual(minimal);
  });

  it("survives a JSON round trip", () => {
    expect(ManifestSchema.parse(JSON.parse(JSON.stringify(crm)))).toEqual(crm);
  });

  it.each([
    ["an uppercase tool name", { name: "CRM" }],
    ["a version that is not semver", { version: "1.4" }],
    ["an unknown top-level key", { colour: "red" }],
    ["a missing interfaces key", { interfaces: { mcp: true } }],
    ["an unknown data mode for previews", { preview: { data: "copy" } }],
  ])("rejects %s", (_, patch) => {
    expect(ManifestSchema.safeParse({ ...crm, ...patch }).success).toBe(false);
  });

  it.each(["1.5.0-preview.my-branch.3", "1.4.0+a41f9e0"])("accepts the version %s", (version) => {
    expect(ManifestSchema.safeParse({ ...crm, version }).success).toBe(true);
  });
});

describe("actions", () => {
  it.each([
    ["no description", { description: "" }],
    ["no access level", { access: undefined }],
    ["an input that is not an object schema", { input: { type: "string" } }],
    ["an unsupported HTTP method", { http: { method: "PUT" } }],
    ["an unknown interface", { interfaces: ["grpc"] }],
    ["a rate limit of zero", { rateLimit: { per: "user", max: 0, window: "1m" } }],
  ])("rejects an action with %s", (_, patch) => {
    expect(ManifestSchema.safeParse(withAction(patch)).success).toBe(false);
  });

  it("accepts a level specific to the tool", () => {
    expect(ManifestSchema.safeParse(withAction({ access: "import" })).success).toBe(true);
  });

  it("accepts an action at the root of actions/", () => {
    const { "deals.move": action } = crm.actions;
    expect(ManifestSchema.safeParse({ ...crm, actions: { ping: action } }).success).toBe(true);
  });

  it.each(["Deals.move", "deals.move.now", "deals.", "1deals.move"])(
    "rejects the action name %s",
    (name) => {
      const { "deals.move": action } = crm.actions;
      expect(ManifestSchema.safeParse({ ...crm, actions: { [name]: action } }).success).toBe(false);
    },
  );
});

describe("resources", () => {
  it("requires a reason for a connector", () => {
    const { why: _, ...connector } = crm.resources.connectors!.microsoft!;
    const resources = { connectors: { microsoft: connector } };
    expect(ManifestSchema.safeParse({ ...crm, resources }).success).toBe(false);
  });

  it("requires a reason for outbound network", () => {
    const resources = { network: { allow: ["api.hubspot.com"] } };
    expect(ManifestSchema.safeParse({ ...crm, resources }).success).toBe(false);
  });

  it("requires a reason and a label for a per-person secret", () => {
    const resources = { userSecrets: { ODOO_API_KEY: { why: "Read your tickets" } } };
    expect(ManifestSchema.safeParse({ ...crm, resources }).success).toBe(false);
  });

  it("rejects a secret name that is not in capitals", () => {
    const resources = { secrets: { hubspotKey: {} } };
    expect(ManifestSchema.safeParse({ ...crm, resources }).success).toBe(false);
  });

  it("rejects a database engine other than d1", () => {
    const resources = { db: { engine: "postgres" } };
    expect(ManifestSchema.safeParse({ ...crm, resources }).success).toBe(false);
  });

  it("rejects an unknown resource", () => {
    expect(ManifestSchema.safeParse({ ...crm, resources: { gpu: {} } }).success).toBe(false);
  });
});

describe("views", () => {
  it("rejects a path that does not start with a slash", () => {
    const views = { pipeline: { title: "Pipeline", path: "pipeline", access: "read" } };
    expect(ManifestSchema.safeParse({ ...crm, views }).success).toBe(false);
  });
});
