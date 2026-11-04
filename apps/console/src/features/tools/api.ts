import { addresses } from "@forgeron/platform-contract/client";
import { typedClient, typedPlatform, ok, type Api, type FetchJson } from "../../api";

// Typed calls to the console API for the tools (apps/gateway/src/console-api/tools.ts and
// tool-pages.ts). Only the fields shown are kept, whatever else an answer holds.

interface Commit {
  sha: string;
  message?: string;
  author?: string;
}

export type Status = "ready" | "building" | "failed";
export type Impact = "none" | "patch" | "minor" | "major";

export interface ToolRow {
  name: string;
  summary: string | null;
  production: string | null;
  previews: Array<{ branch: string; version: string }>;
  lastDeployment: { at: string; version: string } | null;
}

interface DeploymentLine {
  at: string;
  kind: "deploy" | "promote" | "rollback";
  version: string;
  actor: string;
  commit?: Commit;
}

export interface BranchRow {
  environment: "production" | "preview";
  branch?: string;
  status: Status;
  version: string;
  commit?: Commit;
  deployedBy: string;
  deployedAt: string;
  url?: string;
  rollbackTo?: string;
  migrations: { count: number; last?: string };
  deployments: DeploymentLine[];
}

export interface Branches {
  production: BranchRow | null;
  branches: BranchRow[];
}

export interface ChangelogEntry {
  type: string;
  bump: string;
  description: string;
}

export interface VersionRow {
  version: string;
  publishedAt: string;
  environments: Array<{ environment: "production" | "preview"; branch?: string }>;
  changelog: { entries: ChangelogEntry[]; declared: Impact; detected: Impact } | null;
  previous: string | null;
  changes: Array<{ kind: string; subject: string; impact: string }>;
  impact: Impact;
}

export interface ActivityLine {
  id: string;
  at: string;
  actor: string;
  interface: string;
  kind: string;
  subject: string;
  result: "ok" | "denied" | "error";
}

const text = (value: unknown) => (typeof value === "string" ? value : undefined);
const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const impact = (value: unknown): Impact =>
  value === "patch" || value === "minor" || value === "major" ? value : "none";
const status = (value: unknown): Status =>
  value === "building" || value === "failed" ? value : "ready";

function commitOf(value: unknown): { commit?: Commit } {
  const c = value as Record<string, unknown> | undefined;
  const sha = text(c?.sha);
  if (!sha) return {};
  const message = text(c?.message);
  const author = text(c?.author);
  return { commit: { sha, ...(message ? { message } : {}), ...(author ? { author } : {}) } };
}

export async function loadTools(fetchJson: FetchJson): Promise<ToolRow[]> {
  const body = ok(await typedClient(fetchJson)(addresses.listTools));
  return list<Record<string, any>>(body.tools).map((tool) => ({
    name: String(tool.name),
    summary: text(tool.summary) ?? null,
    production: text(tool.production) ?? null,
    previews: list<{ branch?: unknown; version?: unknown }>(tool.previews).map((p) => ({
      branch: String(p.branch),
      version: String(p.version),
    })),
    lastDeployment: tool.lastDeployment
      ? { at: String(tool.lastDeployment.at), version: String(tool.lastDeployment.version) }
      : null,
  }));
}

const branchRow = (r: Record<string, any>): BranchRow => ({
  environment: r.environment === "production" ? "production" : "preview",
  ...(text(r.branch) ? { branch: text(r.branch)! } : {}),
  status: status(r.status),
  version: String(r.version),
  ...commitOf(r.commit),
  deployedBy: text(r.deployedBy) ?? "",
  deployedAt: String(r.deployedAt),
  ...(text(r.url) ? { url: text(r.url)! } : {}),
  ...(text(r.rollbackTo) ? { rollbackTo: text(r.rollbackTo)! } : {}),
  migrations: {
    count: Number(r.migrations?.count ?? 0),
    ...(text(r.migrations?.last) ? { last: text(r.migrations.last)! } : {}),
  },
  deployments: list<Record<string, any>>(r.deployments).map((d) => ({
    at: String(d.at),
    kind: d.kind === "promote" || d.kind === "rollback" ? d.kind : "deploy",
    version: String(d.version),
    actor: text(d.actor) ?? "",
    ...commitOf(d.commit),
  })),
});

export async function loadBranches(fetchJson: FetchJson, tool: string): Promise<Branches> {
  const body = ok(await typedClient(fetchJson)(addresses.toolBranches, { params: { tool } }));
  return {
    production: body.production ? branchRow(body.production) : null,
    branches: list<Record<string, any>>(body.branches).map(branchRow),
  };
}

export async function loadVersions(fetchJson: FetchJson, tool: string): Promise<VersionRow[]> {
  const body = ok(await typedClient(fetchJson)(addresses.toolVersions, { params: { tool } }));
  return list<Record<string, any>>(body.versions).map((v) => ({
    version: String(v.version),
    publishedAt: String(v.publishedAt),
    environments: list<{ environment?: unknown; branch?: unknown }>(v.environments).map((e) => ({
      environment: e.environment === "production" ? "production" : "preview",
      ...(text(e.branch) ? { branch: text(e.branch)! } : {}),
    })),
    changelog: v.changelog
      ? {
          entries: list<Record<string, unknown>>(v.changelog.entries).map((e) => ({
            type: text(e.type) ?? "changed",
            bump: text(e.bump) ?? "patch",
            description: text(e.description) ?? "",
          })),
          declared: impact(v.changelog.declared),
          detected: impact(v.changelog.detected),
        }
      : null,
    previous: text(v.previous) ?? null,
    changes: list<Record<string, unknown>>(v.changes).map((c) => ({
      kind: String(c.kind),
      subject: String(c.subject),
      impact: String(c.impact),
    })),
    impact: impact(v.impact),
  }));
}

export async function loadActivity(fetchJson: FetchJson, tool: string): Promise<ActivityLine[]> {
  const body = ok(
    await typedClient(fetchJson)(addresses.toolActivity, { params: { tool }, query: {} }),
  );
  return list<Record<string, unknown>>(body.entries).map((e) => ({
    id: String(e.id),
    at: String(e.at),
    actor: text(e.actor) ?? "",
    interface: text(e.interface) ?? "",
    kind: text(e.kind) ?? "",
    subject: text(e.subject) ?? "",
    result: e.result === "denied" || e.result === "error" ? e.result : "ok",
  }));
}

function platform(api: Api) {
  if (!api.sendPlatform) throw new Error("This console cannot reach the platform routes.");
  return typedPlatform(api.sendPlatform);
}

/** `POST /promote`: puts a version the tool already has on production, or on a branch's preview. */
export const promote = async (api: Api, input: { tool: string; version: string; reason: string }) =>
  ok(
    await platform(api)(addresses.promote, {
      json: {
        tool: input.tool,
        version: input.version,
        to: "production",
        ...(input.reason ? { reason: input.reason } : {}),
      },
    }),
  );

/** `POST /rollback`: production serves the version it served before the current one. */
export const rollback = async (api: Api, input: { tool: string; reason: string }) =>
  ok(
    await platform(api)(addresses.rollback, {
      json: {
        tool: input.tool,
        environment: "production",
        ...(input.reason ? { reason: input.reason } : {}),
      },
    }),
  );

/** `DELETE /deploy`: the branch's preview goes, with its Worker and its database. */
export const closePreview = async (api: Api, input: { tool: string; branch: string }) =>
  ok(
    await platform(api)(addresses.closePreview, {
      json: { tool: input.tool, branch: input.branch },
    }),
  );
