import { diffManifests, type Impact, type Manifest } from "@forgeron/manifest";
import type {
  DeploymentCommit,
  DeploymentRecord,
  EnvironmentRecord,
  Registry,
  Tool,
  VersionRecord,
} from "@forgeron/registry";

// What a tool's page reads (docs/console-ux.md, "Tool page"), for admins and developers:
//   GET /api/tools/<name>/branches    production and one preview per branch, with the last deployments
//   GET /api/tools/<name>/versions    the versions, newest first, each with its changelog and what changed
//                                     compared with the version published before it
//   GET /api/tools/<name>/activity    the tool's audit lines, newest first (`?limit=n`, default 50, at most 200)
// A member without the developer role is refused: the commits, authors and audit lines of a tool are
// the team's, not the audience's.

const RECENT = 5;
const MAX_ACTIVITY = 200;
const DEFAULT_ACTIVITY = 50;

interface DeploymentLine {
  at: string;
  kind: DeploymentRecord["kind"];
  version: string;
  /** The email of a member, or what CI signs with. */
  actor: string;
  commit?: DeploymentCommit;
}

interface BranchRow {
  environment: "production" | "preview";
  /** A preview's branch. */
  branch?: string;
  /** Only a deployment that went through exists here: a build that failed leaves no row. */
  status: "ready";
  version: string;
  commit?: DeploymentCommit;
  /** Who put this version on the environment. */
  deployedBy: string;
  deployedAt: string;
  url?: string;
  /** What Roll back would serve again; production only. */
  rollbackTo?: string;
  migrations: { count: number; last?: string };
  /** The latest deployments of this environment, newest first. */
  deployments: DeploymentLine[];
}

interface BranchesAnswer {
  tool: string;
  production: BranchRow | null;
  branches: BranchRow[];
}

interface VersionRow {
  version: string;
  publishedAt: string;
  /** Where it is served now. */
  environments: Array<{ environment: "production" | "preview"; branch?: string }>;
  /** What the author wrote; `null` for a version published without a changelog. */
  changelog: {
    entries: Array<{ type: string; bump: string; description: string }>;
    declared: Impact;
    detected: Impact;
  } | null;
  /** The version published just before this one, `null` for the first. */
  previous: string | null;
  /** The manifest compared with that version's; empty for the first or when it cannot be compared. */
  changes: Array<{ kind: string; subject: string; impact: string }>;
  impact: Impact;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function changelogOf(value: unknown): VersionRow["changelog"] {
  if (!isRecord(value) || !Array.isArray(value.entries)) return null;
  const impact = (v: unknown): Impact =>
    v === "patch" || v === "minor" || v === "major" ? v : "none";
  return {
    entries: value.entries.filter(isRecord).map((e) => ({
      type: String(e.type ?? "changed"),
      bump: String(e.bump ?? "patch"),
      description: String(e.description ?? ""),
    })),
    declared: impact(value.declared),
    detected: impact(value.detected),
  };
}

function compare(previous: unknown, next: unknown): Pick<VersionRow, "changes" | "impact"> {
  if (previous === undefined || !isRecord(previous) || !isRecord(next)) {
    return { changes: [], impact: "none" };
  }
  try {
    const diff = diffManifests(previous as unknown as Manifest, next as unknown as Manifest);
    return {
      changes: diff.changes.map(({ kind, subject, impact }) => ({ kind, subject, impact })),
      impact: diff.impact,
    };
  } catch {
    return { changes: [], impact: "none" };
  }
}

async function actors(registry: Registry, workspace: string) {
  const people = new Map((await registry.listMembers(workspace)).map((m) => [m.id, m.email]));
  // CI signs a deployment with `deploy:<token name>`: say what it is rather than show the raw id.
  return (actor: string) =>
    people.get(actor) ??
    (actor.startsWith("deploy:") ? `${actor.slice("deploy:".length)} (deploy token)` : actor);
}

/** Where a tool is served: `/t/<tool>`, and `/t/<tool>@<branch>` for a preview (dispatch). */
const addressOf = (origin: string, tool: string, branch?: string) =>
  `${origin}/t/${tool}${branch ? `@${branch}` : ""}`;

export async function branches(
  registry: Registry,
  workspace: string,
  tool: Tool,
  origin: string,
): Promise<BranchesAnswer> {
  const who = await actors(registry, workspace);
  const versions = new Map((await registry.listVersions(tool.id)).map((v) => [v.id, v]));
  const deployments = await registry.listDeployments(tool.id);
  // A rollback or a promotion carries no commit of its own: the version's own deployment has it.
  const commitOfVersion = new Map<string, DeploymentCommit>();
  for (const d of [...deployments].reverse()) {
    if (d.commit) commitOfVersion.set(d.versionId, d.commit);
  }
  const line = (d: DeploymentRecord): DeploymentLine => {
    const commit = d.commit ?? commitOfVersion.get(d.versionId);
    return {
      at: d.createdAt,
      kind: d.kind,
      version: versions.get(d.versionId)?.version ?? d.versionId,
      actor: who(d.actor),
      ...(commit ? { commit } : {}),
    };
  };

  const row = async (environment: EnvironmentRecord): Promise<BranchRow | undefined> => {
    const version = environment.versionId ? versions.get(environment.versionId) : undefined;
    if (!version) return undefined;
    const history = deployments.filter((d) => d.environmentId === environment.id);
    const latest = history[0];
    const commit = latest?.commit ?? commitOfVersion.get(version.id);
    const build = await registry.getBuild(version.buildId);
    const names = Array.isArray(build?.migrations)
      ? (build.migrations as Array<{ name?: unknown }>)
          .map((m) => m.name)
          .filter((n): n is string => typeof n === "string")
      : [];
    const previous =
      environment.name === "production"
        ? await registry.previousVersion(environment.id)
        : undefined;
    return {
      environment: environment.name,
      ...(environment.branch ? { branch: environment.branch } : {}),
      status: "ready",
      version: version.version,
      ...(commit ? { commit } : {}),
      deployedBy: latest ? who(latest.actor) : "",
      deployedAt: environment.activatedAt ?? latest?.createdAt ?? version.createdAt,
      url: addressOf(origin, tool.name, environment.branch ?? undefined),
      ...(previous ? { rollbackTo: previous.version } : {}),
      migrations: { count: names.length, ...(names.length ? { last: names.at(-1)! } : {}) },
      deployments: history.slice(0, RECENT).map(line),
    };
  };

  let production: BranchRow | null = null;
  const previews: BranchRow[] = [];
  for (const environment of await registry.listEnvironments(tool.id)) {
    const built = await row(environment);
    if (!built) continue;
    if (environment.name === "production") production = built;
    else previews.push(built);
  }
  previews.sort((a, b) => (a.deployedAt < b.deployedAt ? 1 : a.deployedAt > b.deployedAt ? -1 : 0));
  return { tool: tool.name, production, branches: previews };
}

export async function versionsOf(
  registry: Registry,
  tool: Tool,
): Promise<{ tool: string; versions: VersionRow[] }> {
  const published: VersionRecord[] = await registry.listVersions(tool.id);
  const served = new Map<string, VersionRow["environments"]>();
  for (const e of await registry.listEnvironments(tool.id)) {
    if (!e.versionId) continue;
    const list = served.get(e.versionId) ?? [];
    list.push({ environment: e.name, ...(e.branch ? { branch: e.branch } : {}) });
    served.set(e.versionId, list);
  }
  const rows: VersionRow[] = [];
  let before: { version: string; manifest: unknown } | undefined;
  for (const v of published) {
    const build = await registry.getBuild(v.buildId);
    rows.push({
      version: v.version,
      publishedAt: v.createdAt,
      environments: served.get(v.id) ?? [],
      changelog: changelogOf(build?.changelog),
      previous: before?.version ?? null,
      ...compare(before?.manifest, build?.manifest),
    });
    before = { version: v.version, manifest: build?.manifest };
  }
  return { tool: tool.name, versions: rows.reverse() };
}

/** The tool's audit lines. `limit` is lenient: anything but a positive integer is the default. */
export async function activityOf(
  registry: Registry,
  workspace: string,
  tool: Tool,
  asked: string | undefined,
) {
  const n = Number(asked ?? DEFAULT_ACTIVITY);
  const limit = Number.isInteger(n) && n > 0 ? Math.min(n, MAX_ACTIVITY) : DEFAULT_ACTIVITY;
  const who = await actors(registry, workspace);
  const entries = (await registry.listAudit(tool.id, { limit })).map((r) => ({
    id: r.id,
    at: r.at,
    actor: who(r.actor),
    interface: r.interface,
    kind: r.kind,
    subject: r.subject,
    result: r.result,
  }));
  return { tool: tool.name, entries };
}
