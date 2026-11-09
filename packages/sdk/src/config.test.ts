import { describe, expect, it } from "vitest";
import { bucket, connector, database, defineConfig, field, kv, queue } from "./index";

describe("defineConfig", () => {
  // The odoo-gateway example of docs/examples/02-odoo-gateway.md.
  const odoo = {
    name: "odoo",
    title: "Odoo gateway",
    interfaces: { mcp: true, cli: true },
    resources: {
      secrets: { ODOO_URL: { why: "Address of the Odoo instance" } },
      userSecrets: {
        ODOO_API_KEY: { label: "Odoo API key", why: "Read your tickets with your own permissions" },
      },
      network: { allow: ["*.odoo.com"], why: "Calls to the Odoo API" },
      cache: kv(),
    },
    roles: { support: { label: "Support", grants: ["read", "write"] } },
  };

  it("returns the config it was given", () => {
    expect(defineConfig(odoo)).toBe(odoo);
  });

  it("accepts a tool that needs nothing but a name", () => {
    expect(defineConfig({ name: "hello" })).toEqual({ name: "hello" });
  });

  it.each(["CRM", "my tool", "", "crm_2"])("refuses the name %j", (name) => {
    expect(() => defineConfig({ name })).toThrow(/pattern/);
  });

  it("refuses a malformed access level in a role", () => {
    expect(() => defineConfig({ name: "crm", roles: { sales: { grants: ["Read"] } } })).toThrow(
      /pattern/,
    );
  });

  it("refuses a malformed name in `uses`", () => {
    expect(() => defineConfig({ name: "crm", uses: { Contacts: "^2.0.0" } })).toThrow(/pattern/);
  });
});

describe("resource helpers", () => {
  it("database defaults to D1", () => {
    expect(database()).toEqual({ engine: "d1" });
    expect(database({ why: "Leads" })).toEqual({ engine: "d1", why: "Leads" });
  });

  it("bucket keeps its limits", () => {
    expect(bucket({ maxSize: "25MB", types: ["image/*"], why: "Attachments" })).toEqual({
      maxSize: "25MB",
      types: ["image/*"],
      why: "Attachments",
    });
  });

  it("kv and queue need nothing", () => {
    expect(kv()).toEqual({});
    expect(queue({ why: "Sending summaries" })).toEqual({ why: "Sending summaries" });
  });

  it("connector names its type", () => {
    expect(
      connector("microsoft-365", {
        mode: "delegated",
        scopes: ["Mail.Send"],
        why: "Send an email",
      }),
    ).toEqual({
      type: "microsoft-365",
      mode: "delegated",
      scopes: ["Mail.Send"],
      why: "Send an email",
    });
  });
});

describe("field (D-096)", () => {
  it("makes a plain field required unless it says otherwise", () => {
    expect(field.text({ label: "First name" })).toEqual({
      type: "text",
      required: true,
      label: "First name",
    });
    expect(field.text({ label: "Nick", required: false, maxLength: 20 })).toEqual({
      type: "text",
      required: false,
      label: "Nick",
      maxLength: 20,
    });
    expect(field.choice({ label: "Team", options: ["a", "b"] })).toEqual({
      type: "choice",
      required: true,
      label: "Team",
      options: ["a", "b"],
    });
  });

  it("marks a secret, with the reason the platform shows", () => {
    expect(
      field.secret({ label: "Odoo API key", why: "Read your tickets", help: "Odoo > Security" }),
    ).toEqual({
      type: "secret",
      label: "Odoo API key",
      why: "Read your tickets",
      help: "Odoo > Security",
    });
  });

  it("goes in a config's setup unchanged", () => {
    const config = {
      name: "odoo",
      setup: { fields: { firstName: field.text({ label: "First name" }) } },
    };
    expect(defineConfig(config)).toBe(config);
  });
});

describe("field.secret with a kind (D-105)", () => {
  it("carries the kind a person's saved secrets are offered by", () => {
    expect(field.secret({ label: "Odoo API key", why: "Read", kind: "odoo.api-key" })).toEqual({
      type: "secret",
      label: "Odoo API key",
      why: "Read",
      kind: "odoo.api-key",
    });
  });
});
