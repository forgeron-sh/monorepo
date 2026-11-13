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

describe("event handlers", () => {
  const withEvents = (events: unknown) => ManifestSchema.safeParse({ ...crm, events }).success;

  it("accepts a sync and a queue handler", () => {
    expect(
      withEvents({
        a: { event: "deal.moved", mode: "sync" },
        b: { event: "deal.moved", mode: "queue" },
      }),
    ).toBe(true);
  });

  it.each([
    ["an event name that is not group.past", { a: { event: "moved", mode: "sync" } }],
    ["an event name with a capital group", { a: { event: "Deal.moved", mode: "sync" } }],
    ["an unknown mode", { a: { event: "deal.moved", mode: "async" } }],
    ["a missing mode", { a: { event: "deal.moved" } }],
    ["an unknown key", { a: { event: "deal.moved", mode: "sync", retries: 5 } }],
  ])("rejects %s", (_, events) => {
    expect(withEvents(events)).toBe(false);
  });

  it("requires the events key, like the other resolved ones", () => {
    const { events: _, ...without } = crm;
    expect(ManifestSchema.safeParse(without).success).toBe(false);
  });
});

describe("views", () => {
  it("rejects a path that does not start with a slash", () => {
    const views = { pipeline: { title: "Pipeline", path: "pipeline", access: "read" } };
    expect(ManifestSchema.safeParse({ ...crm, views }).success).toBe(false);
  });
});

describe("invariants", () => {
  const view = (path: string) => ({ title: "View", path, access: "read" });
  const messages = (input: unknown) => {
    const result = ManifestSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  };

  it.each(["/mcp", "/api", "/cli", "/play", "/_f", "/api/openapi.json", "/play/x"])(
    "rejects a view on the reserved path %s",
    (path) => {
      const [message] = messages({ ...crm, views: { pipeline: view(path) } });
      expect(message).toContain("reserved path");
      expect(message).toContain(path);
    },
  );

  it.each(["/pipeline", "/apiary", "/play-area", "/mcp-tools", "/a/api"])(
    "accepts a view on %s",
    (path) => {
      expect(ManifestSchema.safeParse({ ...crm, views: { pipeline: view(path) } }).success).toBe(
        true,
      );
    },
  );

  it("rejects two views on the same path", () => {
    const views = { pipeline: view("/pipeline"), funnel: view("/pipeline") };
    expect(messages({ ...crm, views })).toEqual([
      'View "funnel" uses the path "/pipeline", already used by "pipeline".',
    ]);
  });

  it("rejects action names that differ only by case", () => {
    const { "deals.move": action } = crm.actions;
    const actions = { "deals.moveNow": action, "deals.movenow": action };
    expect(messages({ ...crm, actions })).toEqual([
      'Action "deals.movenow" duplicates "deals.moveNow": action names are compared without case.',
    ]);
  });

  it("accepts distinct action names", () => {
    const { "deals.move": action } = crm.actions;
    const actions = { "deals.move": action, "deals.list": action, "contacts.list": action };
    expect(ManifestSchema.safeParse({ ...crm, actions }).success).toBe(true);
  });

  it("points at the action that has no access level or description", () => {
    const action = crm.actions["deals.move"]!;
    const { access: _, ...noAccess } = action;
    const { description: __, ...noDescription } = action;
    for (const broken of [noAccess, noDescription]) {
      const result = ManifestSchema.safeParse({ ...crm, actions: { "deals.move": broken } });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path.slice(0, 2)).toEqual(["actions", "deals.move"]);
    }
  });
});

describe("setup (D-096)", () => {
  const setup = {
    fields: {
      firstName: { type: "text", label: "First name", required: true },
      team: { type: "choice", label: "Team", required: false, options: ["support", "sales"] },
    },
    check: "deals.move",
  };

  it("accepts plain fields and a check that is an action", () => {
    expect(ManifestSchema.safeParse({ ...crm, setup }).success).toBe(true);
    expect(ManifestSchema.safeParse({ ...crm, setup: { fields: {} } }).success).toBe(true);
  });

  it.each([
    ["a check that is not an action", { ...setup, check: "ghost.run" }],
    [
      "a field name in upper case (that is a secret's)",
      { fields: { FIRST: setup.fields.firstName } },
    ],
    ["a field name that starts with a digit", { fields: { "1st": setup.fields.firstName } }],
    [
      "a secret field (it belongs to resources.userSecrets)",
      {
        fields: { key: { type: "secret", label: "Key", why: "x" } },
      },
    ],
    ["a choice with no option", { fields: { team: { ...setup.fields.team, options: [] } } }],
    ["a field without required", { fields: { firstName: { type: "text", label: "First name" } } }],
    ["an unknown key", { ...setup, colour: "red" }],
  ])("rejects %s", (_, bad) => {
    expect(ManifestSchema.safeParse({ ...crm, setup: bad }).success).toBe(false);
  });
});

describe("the kind of a per-person secret (D-105)", () => {
  const withKind = (kind: unknown) => ({
    ...crm,
    resources: {
      ...crm.resources,
      userSecrets: { ODOO_API_KEY: { label: "Odoo API key", why: "Read your tickets", kind } },
    },
  });

  it.each(["odoo.api-key", "github.token", "slack"])("accepts the kind %s", (kind) => {
    expect(ManifestSchema.safeParse(withKind(kind)).success).toBe(true);
  });

  it.each(["Odoo.Key", "odoo..key", ".key", "odoo key", "", "1odoo", "a".repeat(61)])(
    "rejects the kind %j",
    (kind) => {
      expect(ManifestSchema.safeParse(withKind(kind)).success).toBe(false);
    },
  );
});

describe("a manifest stored before D-136", () => {
  it("reads `roles` as `profiles`", () => {
    const { profiles, ...rest } = crm;
    expect(ManifestSchema.parse({ ...rest, roles: profiles })).toEqual(crm);
  });

  it("drops the directory's `roles`", () => {
    const resources = { ...crm.resources, directory: { why: "Names", members: true, roles: true } };
    const parsed = ManifestSchema.parse({ ...crm, resources });
    expect(parsed.resources.directory).toEqual({ why: "Names", members: true });
  });

  it("keeps `profiles` when both are there", () => {
    const parsed = ManifestSchema.parse({ ...crm, roles: { old: { grants: ["read"] } } });
    expect(Object.keys(parsed.profiles)).toEqual(Object.keys(crm.profiles));
  });
});
