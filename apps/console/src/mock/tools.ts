// The tools' data for the harness: a CRM with a production version, its history and several
// branch previews, in every state the screens draw. Made up; no secret in it.

type Json = Record<string, any>;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

interface Version {
  version: string;
  age: number;
  entries: Array<{ type: string; bump: string; description: string }>;
  changes: Array<{ kind: string; subject: string; impact: string }>;
  impact: string;
  migrations: string[];
}

const VERSIONS: Version[] = [
  {
    version: "1.2.0",
    age: 40 * DAY,
    entries: [{ type: "added", bump: "minor", description: "Companies can be merged." }],
    changes: [],
    impact: "none",
    migrations: ["0001_init", "0002_companies"],
  },
  {
    version: "1.3.0",
    age: 21 * DAY,
    entries: [
      { type: "added", bump: "minor", description: "New `deals.move` action." },
      { type: "fixed", bump: "patch", description: "`contacts.search` ignores accents." },
    ],
    changes: [{ kind: "action.added", subject: "actions.deals.move", impact: "minor" }],
    impact: "minor",
    migrations: ["0001_init", "0002_companies", "0003_deals"],
  },
  {
    version: "1.4.0",
    age: 6 * DAY,
    entries: [
      { type: "changed", bump: "major", description: "`contacts.list` needs a page size." },
    ],
    changes: [
      {
        kind: "input.field-added-required",
        subject: "actions.contacts.list.input.limit",
        impact: "major",
      },
    ],
    impact: "major",
    migrations: ["0001_init", "0002_companies", "0003_deals"],
  },
  {
    version: "1.5.0",
    age: 2 * DAY,
    entries: [{ type: "added", bump: "minor", description: "Export contacts as CSV." }],
    changes: [
      { kind: "action.added", subject: "actions.contacts.export", impact: "minor" },
      { kind: "resource.added", subject: "resources.network", impact: "minor" },
    ],
    impact: "minor",
    migrations: ["0001_init", "0002_companies", "0003_deals", "0004_export_index"],
  },
  {
    version: "1.5.1",
    age: 3 * HOUR,
    entries: [{ type: "fixed", bump: "patch", description: "The export keeps the column order." }],
    changes: [
      { kind: "action.description-changed", subject: "actions.contacts.export", impact: "patch" },
    ],
    impact: "patch",
    migrations: ["0001_init", "0002_companies", "0003_deals", "0004_export_index"],
  },
];

const COMMITS: Record<string, { sha: string; message: string; author: string }> = {
  "1.2.0": { sha: "3f1a9c2e", message: "Merge companies", author: "Ada Lovelace" },
  "1.3.0": { sha: "9b7d210a", message: "Add deals.move", author: "Bob Martin" },
  "1.4.0": {
    sha: "c0ffee42",
    message: "Require a page size on contacts.list",
    author: "Ada Lovelace",
  },
  "1.5.0": { sha: "a41f9e0c", message: "Export contacts as CSV", author: "Claire Dubois" },
  "1.5.1": {
    sha: "5e8d77b1",
    message: "Keep the column order in the export",
    author: "Bob Martin",
  },
};

export function createToolsMock(workspaceEndpoint: string, iso: (offset: number) => string) {
  const state = {
    production: ["1.2.0", "1.3.0", "1.4.0"],
    previews: [
      {
        branch: "feat-export",
        version: "1.5.1",
        status: "ready",
        age: 3 * HOUR,
        history: ["1.5.0", "1.5.1"],
      },
      {
        branch: "feat-contacts-import",
        version: "1.5.0",
        status: "building",
        age: 4 * MIN,
        history: ["1.5.0"],
      },
      {
        branch: "fix-accents-search",
        version: "1.3.0",
        status: "failed",
        age: 2 * DAY,
        history: ["1.3.0"],
      },
      { branch: "main", version: "1.4.0", status: "ready", age: 6 * DAY, history: ["1.4.0"] },
    ] as Array<Json>,
    log: [] as Array<Json>,
  };
  const url = (tool: string, branch?: string) =>
    branch
      ? `https://${branch}--${tool}.preview.fabriks.example`
      : `${workspaceEndpoint}/t/${tool}`;
  const migrations = (v: string) => VERSIONS.find((x) => x.version === v)!.migrations;
  const row = (
    tool: string,
    env: "production" | "preview",
    version: string,
    age: number,
    history: string[],
    extra: Json = {},
  ) => {
    const names = migrations(version);
    return {
      environment: env,
      ...(extra.branch ? { branch: extra.branch } : {}),
      status: extra.status ?? "ready",
      version,
      commit: COMMITS[version],
      deployedBy:
        env === "production"
          ? "ada@acme.example"
          : COMMITS[version]!.author.toLowerCase().replace(/ .*/, "") + "@acme.example",
      deployedAt: iso(-age),
      url: url(tool, extra.branch),
      ...(env === "production" && history.length > 1
        ? { rollbackTo: [...history].reverse().find((v) => v !== version) }
        : {}),
      migrations: { count: names.length, last: names.at(-1) },
      deployments: [...history]
        .reverse()
        .slice(0, 5)
        .map((v, i) => ({
          at: iso(-(age + i * 2 * DAY)),
          kind: "deploy",
          version: v,
          actor: "ci",
          commit: COMMITS[v],
        })),
    };
  };

  return {
    summary: (tool: string) =>
      tool === "crm"
        ? {
            summary: "Companies, contacts and deals.",
            lastDeployment: { at: iso(-4 * MIN), version: "1.5.0" },
          }
        : {
            summary: tool === "odoo" ? "Tickets and invoices from Odoo." : null,
            lastDeployment: { at: iso(-9 * DAY), version: "0.2.0" },
          },
    branches(tool: string) {
      if (tool !== "crm") {
        return {
          tool,
          production: null,
          channels: [],
          branches: [],
        };
      }
      const prod = state.production.at(-1)!;
      return {
        tool,
        production: row(tool, "production", prod, 6 * DAY, state.production),
        // A permanent channel an admin added (D-125), with its own database.
        channels: [
          {
            ...row(tool, "production", "1.5.0", 2 * DAY, ["1.4.0", "1.5.0"]),
            environment: "channel",
            channel: "staging",
            follows: "staging",
            url: `https://acme.fabriks.example/t/${tool}~staging`,
          },
        ],
        branches: state.previews.map((p) =>
          row(tool, "preview", p.version, p.age, p.history, { branch: p.branch, status: p.status }),
        ),
      };
    },
    versions(tool: string) {
      if (tool !== "crm") return { tool, versions: [] };
      const served = (v: string) => [
        ...(state.production.at(-1) === v ? [{ environment: "production" }] : []),
        ...state.previews
          .filter((p) => p.version === v)
          .map((p) => ({ environment: "preview", branch: p.branch })),
      ];
      return {
        tool,
        versions: VERSIONS.map((v, i) => ({
          version: v.version,
          publishedAt: iso(-v.age),
          environments: served(v.version),
          branch: "main",
          release: true,
          changelog: {
            entries: v.entries,
            declared: v.impact === "none" ? "minor" : v.impact,
            detected: v.impact,
          },
          previous: VERSIONS[i - 1]?.version ?? null,
          changes: v.changes,
          impact: v.impact,
        })).reverse(),
      };
    },
    activity: (tool: string) => ({
      tool,
      entries: [
        ...state.log,
        {
          id: "a1",
          at: iso(-3 * HOUR),
          actor: "ci",
          interface: "cli",
          kind: "deployment",
          subject: "preview:1.5.1",
          result: "ok",
        },
        {
          id: "a2",
          at: iso(-2 * DAY),
          actor: "ci",
          interface: "cli",
          kind: "deployment",
          subject: "preview:1.5.0",
          result: "ok",
        },
        {
          id: "a3",
          at: iso(-6 * DAY),
          actor: "ada@acme.example",
          interface: "web",
          kind: "promotion",
          subject: "production:1.4.0",
          result: "ok",
        },
        {
          id: "a4",
          at: iso(-6 * DAY - HOUR),
          actor: "bob@acme.example",
          interface: "mcp",
          kind: "action",
          subject: `${tool}.contacts.delete`,
          result: "denied",
        },
      ],
    }),
    rollback() {
      const now = state.production.at(-1)!;
      const before = [...state.production].reverse().find((v) => v !== now)!;
      state.production.push(before);
      state.log.unshift({
        id: `r${state.log.length}`,
        at: iso(0),
        actor: "ada@acme.example",
        interface: "web",
        kind: "rollback",
        subject: `production:${before}`,
        result: "ok",
      });
      return before;
    },
    close(branch: string) {
      state.previews = state.previews.filter((p) => p.branch !== branch);
    },
  };
}
