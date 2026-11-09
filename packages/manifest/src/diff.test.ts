import { describe, expect, it } from "vitest";
import { clone, crm } from "./fixtures";
import { diffManifests, maxImpact, type ChangeKind, type Impact } from "./index";
import type { Manifest } from "./index";

type Mutation = (m: Manifest) => void;

function diff(mutate: Mutation) {
  const next = clone(crm);
  mutate(next);
  return diffManifests(crm, next);
}

const move = (m: Manifest) => m.actions["deals.move"]!;
const input = (m: Manifest) =>
  move(m).input as unknown as { properties: Record<string, object>; required: string[] };

// One row per change of the table in sdk.md §16: what changes, what Forgeron must detect.
const cases: Array<[string, Mutation, ChangeKind, Impact]> = [
  ["action removed", (m) => delete m.actions["deals.move"], "action.removed", "major"],
  [
    "action renamed",
    (m) => {
      m.actions["deals.shift"] = move(m);
      delete m.actions["deals.move"];
    },
    "action.removed",
    "major",
  ],
  [
    "required input field added",
    (m) => {
      input(m).properties.owner = { type: "string" };
      input(m).required.push("owner");
    },
    "input.field-added-required",
    "major",
  ],
  [
    "input field type narrowed (enum value dropped)",
    (m) => (input(m).properties.stage = { enum: ["won"] }),
    "input.field-narrowed",
    "major",
  ],
  [
    "input field type narrowed (minimum raised)",
    (m) => (input(m).properties.id = { type: "string", minLength: 3 }),
    "input.field-narrowed",
    "major",
  ],
  ["access level raised", (m) => (move(m).access = "delete"), "action.access-raised", "major"],
  [
    "access level moved to a custom level",
    (m) => (move(m).access = "import"),
    "action.access-raised",
    "major",
  ],
  ["view removed", (m) => delete m.views.pipeline, "view.removed", "major"],
  ["view path changed", (m) => (m.views.pipeline!.path = "/funnel"), "view.path-changed", "major"],
  ["action added", (m) => (m.actions["deals.list"] = move(m)), "action.added", "minor"],
  [
    "optional input field added",
    (m) => (input(m).properties.note = { type: "string" }),
    "input.field-added-optional",
    "minor",
  ],
  [
    "view added",
    (m) => (m.views.board = { title: "Board", path: "/board", access: "read" }),
    "view.added",
    "minor",
  ],
  ["scheduled task added", (m) => (m.jobs.nightly = { cron: "0 2 * * *" }), "job.added", "minor"],
  [
    "description changed",
    (m) => (move(m).description = "Moves a lead to another stage."),
    "action.description-changed",
    "patch",
  ],
];

describe("diffManifests", () => {
  it("reports no change for equal manifests", () => {
    expect(diffManifests(crm, clone(crm))).toEqual({
      changes: [],
      impact: "none",
      pendingApproval: false,
    });
  });

  it("ignores the version", () => {
    expect(diff((m) => (m.version = "1.5.0")).impact).toBe("none");
  });

  it.each(cases)("%s", (_, mutate, kind, impact) => {
    const change = diff(mutate).changes.find((c) => c.kind === kind);
    expect(change?.impact).toBe(impact);
  });

  it("takes the strongest impact", () => {
    const result = diff((m) => {
      move(m).description = "Changed.";
      m.actions["deals.list"] = move(m);
      delete m.views.pipeline;
    });
    expect(result.impact).toBe("major");
    expect(result.changes.map((c) => c.impact).sort()).toEqual(["major", "minor", "patch"]);
  });

  it("names the field that changed", () => {
    const result = diff((m) => (input(m).properties.stage = { enum: ["won"] }));
    expect(result.changes).toEqual([
      { kind: "input.field-narrowed", subject: "actions.deals.move.input.stage", impact: "major" },
    ]);
  });

  it("is the same in both directions for a symmetrical rename of a view path", () => {
    const next = clone(crm);
    next.views.pipeline!.path = "/funnel";
    expect(diffManifests(next, crm).impact).toBe("major");
  });
});

describe("access levels", () => {
  it("lowering a level is a minor", () => {
    expect(diff((m) => (move(m).access = "read")).changes[0]).toMatchObject({
      kind: "action.access-lowered",
      impact: "minor",
    });
  });

  it("raising the level of a view is a major", () => {
    expect(diff((m) => (m.views.pipeline!.access = "admin")).impact).toBe("major");
  });
});

describe("input schemas", () => {
  it("makes an optional field required a major", () => {
    const before = clone(crm);
    input(before).properties.note = { type: "string" };
    const after = clone(before);
    input(after).required.push("note");
    expect(diffManifests(before, after).changes[0]).toMatchObject({
      kind: "input.field-made-required",
      impact: "major",
    });
  });

  it("widening a field is a minor", () => {
    const result = diff((m) => (input(m).properties.stage = { enum: ["won", "lost", "paused"] }));
    expect(result.changes[0]).toMatchObject({ kind: "input.field-widened", impact: "minor" });
  });

  it("changing the type of a field is a major", () => {
    const result = diff((m) => (input(m).properties.id = { type: "number" }));
    expect(result.changes[0]).toMatchObject({ kind: "input.field-incompatible", impact: "major" });
  });

  it("ignores the descriptions of a schema", () => {
    expect(
      diff((m) => (input(m).properties.id = { type: "string", description: "x" })),
    ).toMatchObject({ impact: "none" });
  });

  it("follows nested objects and array items", () => {
    const before = clone(crm);
    input(before).properties.tags = { type: "array", items: { type: "string" } };
    const after = clone(before);
    input(after).properties.tags = { type: "array", items: { type: "number" } };
    expect(diffManifests(before, after).changes[0]).toMatchObject({
      subject: "actions.deals.move.input.tags[]",
      impact: "major",
    });
  });

  it("treats a keyword it cannot reason about as a major", () => {
    const result = diff((m) => (input(m).properties.id = { anyOf: [{ type: "string" }] }));
    expect(result.impact).toBe("major");
  });
});

describe("output schemas", () => {
  const withOutput = (output: object) => {
    const before = clone(crm);
    move(before).output = {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    };
    const after = clone(before);
    move(after).output = output as never;
    return diffManifests(before, after);
  };

  it("a field removed is a major", () => {
    const result = withOutput({ type: "object", properties: {} });
    expect(result.changes[0]).toMatchObject({ kind: "output.field-removed", impact: "major" });
  });

  it("a field added is a minor", () => {
    const result = withOutput({
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" } },
      required: ["id"],
    });
    expect(result.changes[0]).toMatchObject({
      kind: "output.field-added-optional",
      impact: "minor",
    });
  });

  it("a field that may now be missing is a major", () => {
    const result = withOutput({ type: "object", properties: { id: { type: "string" } } });
    expect(result.changes[0]).toMatchObject({
      kind: "output.field-made-optional",
      impact: "major",
    });
  });

  it("a field that widens its type is a major", () => {
    const result = withOutput({
      type: "object",
      properties: { id: { type: ["string", "null"] } },
      required: ["id"],
    });
    expect(result.changes[0]).toMatchObject({ kind: "output.field-widened", impact: "major" });
  });

  it("a field that narrows its type is a minor", () => {
    const result = withOutput({
      type: "object",
      properties: { id: { type: "string", minLength: 1 } },
      required: ["id"],
    });
    expect(result.changes[0]).toMatchObject({ kind: "output.field-narrowed", impact: "minor" });
  });

  it("dropping the schema is a major, declaring one is a minor", () => {
    expect(diff((m) => delete move(m).output).changes[0]).toMatchObject({
      kind: "action.output-dropped",
      impact: "major",
    });
    const before = clone(crm);
    delete move(before).output;
    expect(diffManifests(before, crm).changes[0]).toMatchObject({
      kind: "action.output-declared",
      impact: "minor",
    });
  });
});

describe("what breaks an existing caller", () => {
  it.each<[string, Mutation, ChangeKind]>([
    ["the HTTP method", (m) => (move(m).http.method = "GET"), "action.http-method-changed"],
    ["the positional arguments", (m) => (move(m).cli.args = ["id"]), "action.cli-args-changed"],
    ["an interface taken away", (m) => (move(m).interfaces = ["mcp"]), "action.interface-removed"],
    [
      "an interface of the tool turned off",
      (m) => (m.interfaces.web = false),
      "tool.interface-removed",
    ],
    ["a role dropped", (m) => delete m.roles.commercial, "role.removed"],
    [
      "a grant taken from a role",
      (m) => (m.roles.direction!.grants = ["read"]),
      "role.grant-removed",
    ],
    ["the tool renamed", (m) => (m.name = "crm2"), "tool.renamed"],
  ])("%s is a major", (_, mutate, kind) => {
    const change = diff(mutate).changes.find((c) => c.kind === kind);
    expect(change?.impact).toBe("major");
  });

  it.each<[string, Mutation, ChangeKind]>([
    ["a confirmation toggled", (m) => (move(m).confirm = true), "action.confirm-changed"],
    [
      "a rate limit changed",
      (m) => (move(m).rateLimit = { per: "tool", max: 10, window: "1m" }),
      "action.rate-limit-changed",
    ],
    [
      "a grant added to a role",
      (m) => m.roles.commercial!.grants.push("delete"),
      "role.grant-added",
    ],
    ["a schedule changed", (m) => (m.jobs["monday-summary"]!.cron = "0 8 * * 1"), "job.changed"],
    ["a dependency range changed", (m) => (m.uses.contacts = "^3.0.0"), "uses.range-changed"],
  ])("%s is a minor", (_, mutate, kind) => {
    const change = diff(mutate).changes.find((c) => c.kind === kind);
    expect(change?.impact).toBe("minor");
  });

  it("an interface added to an action is a minor", () => {
    const before = clone(crm);
    move(before).interfaces = ["mcp"];
    expect(diffManifests(before, crm).changes[0]).toMatchObject({
      kind: "action.interface-added",
      impact: "minor",
    });
  });
});

describe("resources", () => {
  it("a new host, scope, connector or per-person secret is a minor", () => {
    const mutations: Array<[ChangeKind, Mutation]> = [
      ["resource.broadened", (m) => m.resources.network!.allow.push("api.example.com")],
      [
        "resource.broadened",
        (m) => m.resources.connectors!.microsoft!.scopes.push("Calendars.Read"),
      ],
      [
        "resource.added",
        (m) =>
          (m.resources.connectors!.slack = {
            type: "slack",
            mode: "delegated",
            scopes: [],
            why: "Post a message",
          }),
      ],
      [
        "resource.added",
        (m) =>
          (m.resources.userSecrets!.GITHUB_TOKEN = { label: "GitHub token", why: "Read issues" }),
      ],
    ];
    for (const [kind, mutate] of mutations) {
      const change = diff(mutate).changes.find((c) => c.kind === kind);
      expect(change?.impact).toBe("minor");
    }
  });

  it("a resource that did not exist is a minor", () => {
    const before = clone(crm);
    delete before.resources.files;
    expect(diffManifests(before, crm).changes[0]).toMatchObject({
      kind: "resource.added",
      subject: "resources.files",
      impact: "minor",
    });
  });

  it("a removed resource is a patch", () => {
    const result = diff((m) => {
      delete m.resources.network;
      delete m.resources.db;
    });
    expect(result.changes.map((c) => c.kind)).toEqual(["resource.removed", "resource.removed"]);
    expect(result.impact).toBe("patch");
  });

  it("a reworded reason is a patch", () => {
    expect(diff((m) => (m.resources.db!.why = "Anything")).changes[0]).toMatchObject({
      kind: "resource.why-changed",
      impact: "patch",
    });
  });
});

describe("maxImpact", () => {
  it("orders none < patch < minor < major", () => {
    expect(maxImpact("none", "patch")).toBe("patch");
    expect(maxImpact("minor", "patch")).toBe("minor");
    expect(maxImpact("minor", "major")).toBe("major");
  });
});

describe("event handlers", () => {
  it("a handler added or removed is a minor", () => {
    const added = diff((m) => (m.events.audit = { event: "deal.won", mode: "sync" }));
    expect(added.changes).toEqual([
      { kind: "event.added", subject: "events.audit", impact: "minor" },
    ]);
    const removed = diff((m) => delete m.events["send-summary"]);
    expect(removed.changes).toEqual([
      { kind: "event.removed", subject: "events.send-summary", impact: "minor" },
    ]);
  });

  it("a handler that changes event or mode is a minor", () => {
    const mode = diff((m) => (m.events["deal-history"]!.mode = "queue"));
    expect(mode.changes[0]).toMatchObject({ kind: "event.changed", impact: "minor" });
    const event = diff((m) => (m.events["deal-history"]!.event = "deal.lost"));
    expect(event.changes[0]).toMatchObject({ kind: "event.changed", impact: "minor" });
  });
});

describe("pending approval", () => {
  const flagged = (mutate: Mutation) => diff(mutate).changes.filter((c) => c.needsApproval);

  it.each<[string, Mutation, string]>([
    [
      "a new connector",
      (m) =>
        (m.resources.connectors!.slack = {
          type: "slack",
          mode: "delegated",
          scopes: ["chat:write"],
          why: "Post a message",
        }),
      "resources.connectors.slack",
    ],
    [
      "an extra scope",
      (m) => m.resources.connectors!.microsoft!.scopes.push("Calendars.Read"),
      "resources.connectors.microsoft",
    ],
    [
      "a connector that switches mode",
      (m) => (m.resources.connectors!.microsoft!.mode = "application"),
      "resources.connectors.microsoft",
    ],
    ["a new host", (m) => m.resources.network!.allow.push("api.example.com"), "resources.network"],
    [
      "a new per-person secret",
      (m) =>
        (m.resources.userSecrets!.GITHUB_TOKEN = { label: "GitHub token", why: "Read issues" }),
      "resources.userSecrets.GITHUB_TOKEN",
    ],
    [
      "a new tool secret",
      (m) => (m.resources.secrets!.SLACK_KEY = { why: "Notify" }),
      "resources.secrets.SLACK_KEY",
    ],
    [
      "a broader file store",
      (m) => (m.resources.files!.types = ["application/pdf", "image/*", "text/csv"]),
      "resources.files",
    ],
  ])("flags %s", (_, mutate, subject) => {
    expect(flagged(mutate).map((c) => c.subject)).toEqual([subject]);
    expect(diff(mutate).pendingApproval).toBe(true);
  });

  it("flags a resource the previous version did not have", () => {
    const before = clone(crm);
    delete before.resources.queue;
    const result = diffManifests(before, crm);
    expect(result.pendingApproval).toBe(true);
    expect(result.changes[0]).toMatchObject({ subject: "resources.queue", needsApproval: true });
  });

  it.each<[string, Mutation]>([
    ["a removed resource", (m) => delete m.resources.db],
    ["a removed host", (m) => (m.resources.network!.allow = [])],
    ["a removed scope", (m) => (m.resources.connectors!.microsoft!.scopes = [])],
    ["a removed connector", (m) => delete m.resources.connectors!.microsoft],
    ["a removed per-person secret", (m) => delete m.resources.userSecrets!.ODOO_API_KEY],
    ["a reworded reason", (m) => (m.resources.db!.why = "Anything")],
  ])("does not flag %s", (_, mutate) => {
    const result = diff(mutate);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.pendingApproval).toBe(false);
    expect(flagged(mutate)).toEqual([]);
  });

  it("does not flag changes outside resources", () => {
    const result = diff((m) => (m.actions["deals.list"] = move(m)));
    expect(result.pendingApproval).toBe(false);
  });

  it("keeps the impact of the flagged changes", () => {
    const result = diff((m) => m.resources.network!.allow.push("api.example.com"));
    expect(result).toMatchObject({ impact: "minor", pendingApproval: true });
  });
});

describe("setup changes (D-096)", () => {
  const first = { type: "text" as const, label: "First name", required: true };
  const base = (): Manifest => {
    const m = clone(crm);
    m.setup = { fields: { firstName: first } };
    return m;
  };
  const change = (mutate: Mutation) => {
    const next = base();
    mutate(next);
    return diffManifests(base(), next);
  };

  it("makes a new field a minor change that asks an admin for nothing", () => {
    const result = change((m) => {
      m.setup!.fields.lastName = { ...first, label: "Last name" };
    });
    expect(result.changes).toEqual([
      { kind: "setup.field-added", subject: "setup.fields.lastName", impact: "minor" },
    ]);
    expect(result.pendingApproval).toBe(false);
  });

  it("makes a removed field a patch, a field made required or of another type a minor, a label a patch", () => {
    expect(change((m) => delete m.setup!.fields.firstName).changes[0]).toMatchObject({
      kind: "setup.field-removed",
      impact: "patch",
    });
    const optional = base();
    optional.setup!.fields.firstName = { ...first, required: false };
    expect(diffManifests(optional, base()).changes[0]).toMatchObject({
      kind: "setup.field-changed",
      impact: "minor",
    });
    expect(
      change((m) => (m.setup!.fields.firstName = { ...first, label: "Given name" })).impact,
    ).toBe("patch");
    expect(
      change(
        (m) =>
          (m.setup!.fields.firstName = {
            type: "choice",
            label: "First name",
            required: true,
            options: ["a"],
          }),
      ).impact,
    ).toBe("minor");
  });

  it("sees a check added, changed or dropped, and no setup at all as no change", () => {
    expect(change((m) => (m.setup!.check = "deals.move")).changes[0]).toMatchObject({
      kind: "setup.check-changed",
      impact: "patch",
    });
    expect(diffManifests(crm, clone(crm)).changes).toEqual([]);
  });
});
