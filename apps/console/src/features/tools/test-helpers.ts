import type { Api } from "../../api";
import type { PageProps } from "../../shell/page-props";
import type { WorkspaceInfo } from "../../workspace";
import { fakeApi } from "../../test-utils";

/** `fakeApi` plus the platform routes (`/promote`, `/rollback`, `/deploy`), recorded the same way. */
export function toolsApi(
  routes: Record<string, unknown>,
  platformRoutes: Record<string, unknown> = {},
) {
  const fake = fakeApi(routes);
  const platform: Array<{ path: string; body: unknown; method: string }> = [];
  const api: Api = {
    ...fake.api,
    sendPlatform: async (path, body, method = "POST") => {
      platform.push({ path, body, method });
      const value = platformRoutes[`${method} ${path}`];
      if (value === undefined) return {};
      return typeof value === "function" ? (value as (b: unknown) => unknown)(body) : value;
    },
  };
  return { api, platform, reads: fake.reads };
}

export const NOW = new Date("2026-11-03T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
export const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const tools = {
  tools: [
    {
      name: "crm",
      summary: "Companies, contacts and deals.",
      production: "1.4.0",
      previews: [{ branch: "feat-export", version: "1.5.1" }],
      lastDeployment: { at: ago(3 * HOUR), version: "1.5.1" },
    },
    { name: "draft", summary: null, production: null, previews: [], lastDeployment: null },
    {
      name: "odoo",
      summary: "Tickets and invoices.",
      production: null,
      previews: [{ branch: "main", version: "0.2.0" }],
      lastDeployment: { at: ago(2 * DAY), version: "0.2.0" },
    },
  ],
};

const commit = (sha: string, message: string, author: string) => ({ sha, message, author });

export const branches = {
  tool: "crm",
  production: {
    environment: "production",
    status: "ready",
    version: "1.4.0",
    commit: commit("c0ffee42aa", "Require a page size", "Ada"),
    deployedBy: "ada@acme.test",
    deployedAt: ago(6 * DAY),
    url: "https://demo.test/t/crm",
    rollbackTo: "1.3.0",
    migrations: { count: 3, last: "0003_deals" },
    deployments: [
      { at: ago(6 * DAY), kind: "deploy", version: "1.4.0", actor: "ci" },
      { at: ago(20 * DAY), kind: "deploy", version: "1.3.0", actor: "ci" },
    ],
  },
  branches: [
    {
      environment: "preview",
      branch: "feat-export",
      status: "ready",
      version: "1.5.1",
      commit: commit("5e8d77b1", "Keep the column order", "Bob"),
      deployedBy: "ci",
      deployedAt: ago(3 * HOUR),
      url: "https://feat-export.test",
      migrations: { count: 4, last: "0004_export_index" },
      deployments: [{ at: ago(3 * HOUR), kind: "deploy", version: "1.5.1", actor: "ci" }],
    },
    {
      environment: "preview",
      branch: "fix-search",
      status: "failed",
      version: "1.3.1",
      commit: commit("9b7d210a", "Ignore accents", "Claire"),
      deployedBy: "ci",
      deployedAt: ago(DAY),
      url: "https://fix-search.test",
      migrations: { count: 0 },
      deployments: [],
    },
  ],
};

export const versions = {
  tool: "crm",
  versions: [
    {
      version: "1.5.1",
      publishedAt: ago(3 * HOUR),
      environments: [{ environment: "preview", branch: "feat-export" }],
      changelog: {
        entries: [
          { type: "fixed", bump: "patch", description: "The export keeps the column order." },
        ],
        declared: "patch",
        detected: "patch",
      },
      previous: "1.4.0",
      changes: [{ kind: "action.added", subject: "actions.contacts.export", impact: "minor" }],
      impact: "minor",
    },
    {
      version: "1.4.0",
      publishedAt: ago(6 * DAY),
      environments: [{ environment: "production" }],
      changelog: null,
      previous: null,
      changes: [],
      impact: "none",
    },
  ],
};

const ws = (admin = true): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.test",
  person: { id: "m1", email: "ada@acme.test", name: "Ada", roles: admin ? ["admin"] : [], admin },
  setup: { members: 1, invitations: 0, tools: 3, deployed: 2, called: false },
});

/** What the shell hands a page. */
export const pageProps = (
  api: Api,
  options: { admin?: boolean; go?: (href: string) => void } = {},
): PageProps => ({
  ws: ws(options.admin ?? true),
  api,
  now: () => NOW,
  go: options.go ?? (() => {}),
  params: {},
});

/** What the shell hands a tab. */
export const tabProps = (api: Api, tool = "crm", admin = true) => ({
  tool,
  api,
  ws: ws(admin),
  now: () => NOW,
});
