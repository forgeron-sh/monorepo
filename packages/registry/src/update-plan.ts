// The plan of an update (D-113, D-125): before a release goes to a permanent channel, can it go, and
// what stops it. It reads, it never writes: the migrations are compared with the channel's database
// without applying them, the changelog and the approvals are looked at, the manifest is compared with
// what the channel serves. When something stops it, the plan carries a prompt written for an agent.
import {
  checkMigrations,
  isRelease,
  type BuildMigration,
  type Build,
  type Hosting,
  type MigrationConflict,
} from "@forgeron/hosting";
import { diffManifests, type Impact, type Manifest } from "@forgeron/manifest";
import { RegistryError, type Registry, type Tool } from "./registry";

export type PlanConflictCode =
  | "MIGRATION_MISSING"
  | "MIGRATION_EDITED"
  | "MIGRATION_OUT_OF_ORDER"
  | "CHANGELOG_NO_ENTRY"
  | "CHANGELOG_IMPACT_TOO_LOW"
  | "PENDING_APPROVAL"
  | "NO_ARTIFACT";

export interface PlanConflict {
  code: PlanConflictCode;
  /** What it is about: a migration, a resource. */
  subject?: string;
  message: string;
}

export interface PlanChange {
  kind: string;
  subject: string;
  impact: Exclude<Impact, "none">;
  detail?: string;
  needsApproval?: true;
}

export interface UpdatePlan {
  tool: string;
  /** The release that would go to the channel. */
  version: string;
  /** The branch whose push made it, when known. */
  from?: { branch: string };
  /** The permanent channel: production, or another one by its name. */
  to: { channel: string; currentVersion?: string };
  /** The channel already serves this version: updating it again changes nothing. */
  alreadyServed: boolean;
  /** No conflict: it can go. A destructive migration is not a conflict, it is asked for. */
  ok: boolean;
  conflicts: PlanConflict[];
  /** Pending destructive migrations: the update needs `allowDestructive`. */
  requiresAllowDestructive: boolean;
  migrations: {
    /** False when the target's database could not be read: nothing was compared. */
    checked: boolean;
    applied: string[];
    pending: string[];
    destructive: string[];
  };
  /** What the manifest changes compared with what the target serves. */
  changes: PlanChange[];
  impact: Impact;
  /** For an agent, when `ok` is false: what stops it and how to fix it. */
  prompt?: string;
}

export interface PlanInput {
  tool: Tool;
  /** The permanent channel: `production`, or the name of another one. */
  channel: string;
  /** The version number, as published. */
  version: string;
  /** A marketplace's publication is its release: its changelog may list nothing. */
  published?: boolean;
}

const RANK: Record<Impact, number> = { none: 0, patch: 1, minor: 2, major: 3 };

const MIGRATION_CODE: Record<MigrationConflict["code"], PlanConflictCode> = {
  MISSING: "MIGRATION_MISSING",
  EDITED: "MIGRATION_EDITED",
  OUT_OF_ORDER: "MIGRATION_OUT_OF_ORDER",
};

export async function planUpdate(
  registry: Registry,
  hosting: Hosting,
  input: PlanInput,
): Promise<UpdatePlan> {
  const { tool } = input;
  const environments = await registry.listEnvironments(tool.id);
  const version = await registry.findVersion(tool.id, input.version);
  if (!version) {
    throw new RegistryError("NOT_FOUND", `The tool ${tool.name} has no version ${input.version}.`);
  }
  const record = await registry.getBuild(version.buildId);
  if (!record) throw new RegistryError("NOT_FOUND", `There is no build ${version.buildId}.`);

  const production = input.channel === "production";
  const target = environments.find((e) =>
    production ? e.name === "production" : e.name === "channel" && e.channel === input.channel,
  );
  if (!production && !target) {
    throw new RegistryError("NOT_FOUND", `There is no channel ${input.channel}.`);
  }
  const current = target?.versionId ? await registry.getVersion(target.versionId) : undefined;
  const currentBuild = current ? await registry.getBuild(current.buildId) : undefined;

  const conflicts: PlanConflict[] = [];
  const manifest = record.manifest as Manifest;
  const migrations = (
    Array.isArray(record.migrations) ? record.migrations : []
  ) as BuildMigration[];

  if (record.worker === undefined) {
    conflicts.push({
      code: "NO_ARTIFACT",
      message: `The build ${record.fingerprint} was recorded without its code: deploy it again from CI.`,
    });
  }

  // The changelog: a permanent channel takes only a release that covers the change (sdk.md §16).
  {
    const changelog = record.changelog as Build["changelog"] | undefined;
    if (!input.published && !isRelease(changelog)) {
      conflicts.push({
        code: "CHANGELOG_NO_ENTRY",
        message:
          "A permanent channel takes only releases: run `forgeron change`, then `forgeron release` on the branch it follows.",
      });
    } else if (changelog && RANK[changelog.declared] < RANK[changelog.detected]) {
      conflicts.push({
        code: "CHANGELOG_IMPACT_TOO_LOW",
        message: `The changelog declares ${changelog.declared}, but the manifest changed by ${changelog.detected}: declare ${changelog.detected} or more.`,
      });
    }
    for (const waiting of await registry.unapproved(version.id)) {
      conflicts.push({
        code: "PENDING_APPROVAL",
        subject: waiting.resource,
        message: `${waiting.resource} waits for someone who approves resources to approve it with the update.`,
      });
    }
  }

  // The migrations, against the target's own database. Read only: nothing is applied.
  const report = {
    checked: false,
    applied: [] as string[],
    pending: migrations.map((m) => m.name).sort(),
    destructive: migrations
      .filter((m) => m.destructive)
      .map((m) => m.name)
      .sort(),
  };
  if (manifest.resources.db && hosting.openDatabase) {
    try {
      const db = await hosting.openDatabase(
        production
          ? { tool: tool.name, name: "production" }
          : { tool: tool.name, name: "channel", channel: input.channel },
      );
      if (db) {
        const check = await checkMigrations(db, migrations);
        report.checked = true;
        report.applied = check.applied;
        report.pending = check.pending;
        report.destructive = check.destructive;
        for (const c of check.conflicts) {
          conflicts.push({
            code: MIGRATION_CODE[c.code],
            subject: c.migration,
            message: c.message,
          });
        }
      } else {
        // The target has no database yet: all of them will apply on a fresh one.
        report.checked = true;
      }
    } catch {
      // The target's database could not be read: say it was not compared, do not guess.
    }
  } else if (!manifest.resources.db) {
    report.checked = true;
    report.pending = [];
    report.destructive = [];
  }

  // What the manifest changes is information for the person: a manifest that cannot be compared must not
  // stop the plan from saying what else it found.
  let diff: ReturnType<typeof diffManifests> | undefined;
  try {
    diff = currentBuild ? diffManifests(currentBuild.manifest as Manifest, manifest) : undefined;
  } catch {
    diff = undefined;
  }
  const plan: UpdatePlan = {
    tool: tool.name,
    version: version.version,
    ...(version.branch ? { from: { branch: version.branch } } : {}),
    to: {
      channel: input.channel,
      ...(current ? { currentVersion: current.version } : {}),
    },
    alreadyServed: current?.id === version.id,
    ok: conflicts.length === 0,
    conflicts,
    requiresAllowDestructive: report.destructive.length > 0,
    migrations: report,
    changes: (diff?.changes ?? []).map((c) => ({
      kind: c.kind,
      subject: c.subject,
      impact: c.impact,
      ...(c.detail ? { detail: c.detail } : {}),
      ...(c.needsApproval ? { needsApproval: true as const } : {}),
    })),
    impact: diff?.impact ?? "none",
  };
  return conflicts.length > 0 ? { ...plan, prompt: updatePrompt(plan) } : plan;
}

/** What to do about each kind of conflict: the agent is told the rule, not only the symptom. */
const ADVICE: Record<PlanConflictCode, string> = {
  MIGRATION_MISSING:
    "The channel's database has applied a migration this release does not have, usually because another branch added it and was released first. Bring that migration into this branch (rebase or merge the branch that added it), then regenerate this branch's own migration on top of it with `forgeron db generate` so the names and the order are consistent. Never delete or renumber a migration that was applied anywhere.",
  MIGRATION_EDITED:
    "A migration the channel already applied has been edited in this release. Restore it to what was applied (use git to see the original) and put the new change in a new migration with `forgeron db generate`. An applied migration is never edited.",
  MIGRATION_OUT_OF_ORDER:
    "This release adds a migration whose name sorts before one the channel already applied. Rename it so it comes after the last applied one, or regenerate it with `forgeron db generate` once the branch includes the applied ones. Check that it still makes sense on top of them.",
  CHANGELOG_NO_ENTRY:
    "Add the changelog entries with `forgeron change`, then cut the version with `forgeron release` on the branch the channel follows, and push the commit and the tag.",
  CHANGELOG_IMPACT_TOO_LOW:
    "Declare an impact at least as high as the one detected from the manifest in the change entries (`forgeron change --bump ...`), then release and push again.",
  PENDING_APPROVAL:
    "This release asks for resources production does not have. Someone who holds `tools:approve` approves them with the update (console, Channels, or the admin MCP `tool_update` with approve); this is a human decision.",
  NO_ARTIFACT:
    "The registry holds this build without its code. Push the branch again so that CI deploys it and the code is recorded.",
};

/**
 * The text a person copies into an agent (or reads) when an update cannot go: it carries the tool, the
 * versions, each conflict with its details and the commands that inspect and fix it. The agent is told
 * what it must not do. Plain text, no value of any secret.
 */
export function updatePrompt(plan: UpdatePlan): string {
  const where = plan.to.channel === "production" ? "production" : `the channel ${plan.to.channel}`;
  const source = plan.from
    ? `release ${plan.version} of the branch ${plan.from.branch}`
    : `release ${plan.version}`;
  const kinds = [...new Set(plan.conflicts.map((c) => c.code))];
  const env =
    plan.to.channel === "production" ? "--env production" : `--channel ${plan.to.channel}`;
  const lines: string[] = [
    `I want to update the Forgeron tool "${plan.tool}" on ${where} to ${source}, and Forgeron refused. Help me fix it, step by step, and ask me before anything that changes data.`,
    "",
    `Currently ${where} serves ${plan.to.currentVersion ? `version ${plan.to.currentVersion}` : "no version"}.`,
    "",
    "What stops it:",
    ...plan.conflicts.map(
      (c, i) => `${i + 1}. ${c.code}${c.subject ? ` (${c.subject})` : ""}: ${c.message}`,
    ),
    "",
    "How to fix each kind:",
    ...kinds.map((k) => `- ${k}: ${ADVICE[k]}`),
  ];
  if (plan.migrations.checked) {
    lines.push(
      "",
      `Migrations on ${where}: ${plan.migrations.applied.length ? plan.migrations.applied.join(", ") : "none applied"}. This release would apply: ${plan.migrations.pending.length ? plan.migrations.pending.join(", ") : "nothing"}${plan.migrations.destructive.length ? ` (destructive: ${plan.migrations.destructive.join(", ")})` : ""}.`,
    );
  }
  lines.push(
    "",
    "Useful commands (you are signed in with `forgeron login` as someone who holds `tools:publish` and `tools:approve`):",
    `- forgeron db status ${env}   what the channel's database has applied`,
    `- forgeron db shell ${env} --sql "SELECT ..."   read the channel's data (reads only unless I say otherwise)`,
    "- forgeron db generate   write a new migration from the schema",
    "- forgeron change, then forgeron release, then git push --follow-tags   make a new release on the branch the channel follows",
    "",
    "Forgeron never moves code between branches: the fix is made in Git, on the branch the channel follows. Rules: never edit, delete or renumber a migration that has been applied anywhere. Never run a write or destructive statement on a permanent channel without showing it to me and getting my yes. Do not guess a table or column: read the schema first. Tell me what you changed when you finish.",
  );
  return lines.join("\n");
}
