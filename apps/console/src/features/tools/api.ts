import { addresses } from "@forgeron/platform-contract/client";
import { typedClient, typedPlatform, typedSender, ok, type Api, type FetchJson } from "../../api";

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
  /** One per branch: the temporary channels (D-125). */
  previews: Array<{ branch: string; version: string }>;
  /** The permanent channels other than production that serve a version. */
  channels: Array<{ channel: string; version: string }>;
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
  /** `production` and `channel` are permanent channels; `preview` a branch's temporary one (D-125). */
  environment: "production" | "preview" | "channel";
  branch?: string;
  /** A permanent channel's name, other than production. */
  channel?: string;
  /** The branch a permanent channel follows. */
  follows?: string;
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
  /** The permanent channels other than production that serve a version. */
  channels: BranchRow[];
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
  environments: Array<{
    environment: "production" | "preview" | "channel";
    branch?: string;
    channel?: string;
  }>;
  /** The branch whose push made it, when known. */
  branch?: string;
  /** A release: only releases reach a permanent channel (D-125). */
  release: boolean;
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
    channels: list<{ channel?: unknown; version?: unknown }>(tool.channels).map((c) => ({
      channel: String(c.channel),
      version: String(c.version),
    })),
    lastDeployment: tool.lastDeployment
      ? { at: String(tool.lastDeployment.at), version: String(tool.lastDeployment.version) }
      : null,
  }));
}

const environmentOf = (value: unknown): BranchRow["environment"] =>
  value === "production" || value === "channel" ? value : "preview";

const branchRow = (r: Record<string, any>): BranchRow => ({
  environment: environmentOf(r.environment),
  ...(text(r.branch) ? { branch: text(r.branch)! } : {}),
  ...(text(r.channel) ? { channel: text(r.channel)! } : {}),
  ...(text(r.follows) ? { follows: text(r.follows)! } : {}),
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
    channels: list<Record<string, any>>(body.channels).map(branchRow),
    branches: list<Record<string, any>>(body.branches).map(branchRow),
  };
}

export async function loadVersions(fetchJson: FetchJson, tool: string): Promise<VersionRow[]> {
  const body = ok(await typedClient(fetchJson)(addresses.toolVersions, { params: { tool } }));
  return list<Record<string, any>>(body.versions).map((v) => ({
    version: String(v.version),
    publishedAt: String(v.publishedAt),
    environments: list<{ environment?: unknown; branch?: unknown; channel?: unknown }>(
      v.environments,
    ).map((e) => ({
      environment: environmentOf(e.environment),
      ...(text(e.branch) ? { branch: text(e.branch)! } : {}),
      ...(text(e.channel) ? { channel: text(e.channel)! } : {}),
    })),
    ...(text(v.branch) ? { branch: text(v.branch)! } : {}),
    release: v.release === true,
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

/** What the update shows of its plan (D-113, D-125); absent when the platform did not give one. */
interface UpdatePlanView {
  ok: boolean;
  alreadyServed: boolean;
  conflicts: Array<{ code: string; subject?: string; message: string }>;
  requiresAllowDestructive: boolean;
  migrations: { checked: boolean; pending: string[]; destructive: string[] };
  prompt?: string;
}

/**
 * `POST /rollback`: a permanent channel serves the version it served before the current one: a
 * version it served, no new code (D-125). Production unless `channel` names another.
 */
export const rollback = async (
  api: Api,
  input: { tool: string; reason: string; channel?: string },
) =>
  ok(
    await platform(api)(addresses.rollback, {
      json: {
        tool: input.tool,
        ...(input.channel && input.channel !== "production"
          ? { environment: "channel" as const, channel: input.channel }
          : { environment: "production" as const }),
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

/** The release waiting for a permanent channel (D-125). */
interface UpdateView {
  version: string;
  branch?: string;
  changelog: string[];
  approvals: string[];
  plan?: UpdatePlanView;
}

/** A permanent channel: production, or one an admin added (D-125). */
export interface ChannelView {
  name: string;
  /** The branch whose releases it takes; absent for a marketplace tool. */
  follows?: string;
  autoUpdate: boolean;
  serves: string | null;
  address: string;
  update: UpdateView | null;
}

/** Where a tool comes from, and its permanent channels with their updates (D-121, D-125). */
export interface ToolSourceView {
  kind: "marketplace" | "repo";
  marketplace?: string;
  repo?: string;
  productionBranch: string;
  autoUpdate: boolean;
  production: string | null;
  update: UpdateView | null;
  channels: ChannelView[];
}

export const loadSource = async (fetchJson: FetchJson, tool: string): Promise<ToolSourceView> =>
  ok(await typedClient(fetchJson)(addresses.getToolSource, { params: { tool } }));

/** Puts the waiting release on a permanent channel, approving what the admin ticked. */
export const updateTool = async (
  api: Api,
  tool: string,
  input: { version: string; channel?: string; approve?: boolean; allowDestructive?: boolean },
) => ok(await typedSender(api.sendJson)(addresses.updateTool, { params: { tool }, json: input }));

/** Adds a permanent channel that follows a branch (D-125). */
export const addChannel = async (
  api: Api,
  tool: string,
  input: { name: string; follows?: string; autoUpdate?: boolean },
): Promise<ChannelView> =>
  ok(await typedSender(api.sendJson)(addresses.addChannel, { params: { tool }, json: input }));

/** Changes the branch a permanent channel follows, or whether it updates by itself. */
export const saveChannel = async (
  api: Api,
  tool: string,
  channel: string,
  input: { follows?: string; autoUpdate?: boolean },
): Promise<ChannelView> =>
  ok(
    await typedSender(api.sendJson)(addresses.putChannel, {
      params: { tool, channel },
      json: input,
    }),
  );

/** Removes a permanent channel with its Worker and its database; its name is typed to confirm. */
export const removeChannel = async (api: Api, tool: string, channel: string) =>
  ok(
    await typedSender(api.sendJson)(addresses.removeChannel, {
      params: { tool, channel },
      json: { confirm: channel },
    }),
  );

/** Adds a tool that a GitHub repository's CI deploys; the answer holds its token, shown once. */
export const addRepositoryTool = async (
  api: Api,
  input: { name: string; repo: string; productionBranch?: string },
) => ok(await typedSender(api.sendJson)(addresses.addRepositoryTool, { json: input }));
