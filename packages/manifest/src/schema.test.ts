import { describe, expect, it } from "vitest";
import { crm, minimal } from "./fixtures";
import { ManifestSchema } from "./index";

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
