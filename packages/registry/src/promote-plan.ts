// The plan of a promotion (D-113): before anything moves, can this version go to this environment, and
// what stops it. It reads, it never writes: the migrations are compared with the target's database
// without applying them, the changelog and the approvals are looked at, the manifest is compared with
// what the target serves. When something stops it, the plan carries a prompt written for an agent.
import {
  checkMigrations,
  type BuildMigration,
  type Build,
  type Hosting,
  type MigrationConflict,
} from "@forgeron/hosting";
import { diffManifests, type Impact, type Manifest } from "@forgeron/manifest";
import { RegistryError, type Registry, type RegisteredEnvironment, type Tool } from "./registry";

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

export interface PromotionPlan {
  tool: string;
  /** The version that would be promoted. */
  version: string;
  /** The branch whose preview serves it, when the plan was asked from a branch. */
  from?: { branch: string };
  to: { environment: RegisteredEnvironment; branch?: string; currentVersion?: string };
  /** The target already serves this version: promoting it again changes nothing. */
  alreadyServed: boolean;
  /** No conflict: it can go. A destructive migration is not a conflict, it is asked for. */
  ok: boolean;
  conflicts: PlanConflict[];
  /** Pending destructive migrations: the promotion needs `allowDestructive`. */
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
  to: RegisteredEnvironment;
  /** The target preview's branch. */
  branch?: string;
  /** A version number, as published. */
  version?: string;
  /** Or the branch whose preview serves the version to promote. */
  fromBranch?: string;
}

const RANK: Record<Impact, number> = { none: 0, patch: 1, minor: 2, major: 3 };

const MIGRATION_CODE: Record<MigrationConflict["code"], PlanConflictCode> = {
  MISSING: "MIGRATION_MISSING",
  EDITED: "MIGRATION_EDITED",
  OUT_OF_ORDER: "MIGRATION_OUT_OF_ORDER",
};

export async function planPromotion(
  registry: Registry,
  hosting: Hosting,
  input: PlanInput,
): Promise<PromotionPlan> {
  const { tool } = input;
  const environments = await registry.listEnvironments(tool.id);
  // The version: named, or the one a branch's preview serves.
  let versionNumber = input.version;
  if (input.fromBranch !== undefined) {
    const preview = environments.find((e) => e.name === "preview" && e.branch === input.fromBranch);
    if (!preview?.versionId) {
      throw new RegistryError(
        "NOT_FOUND",
        `The branch ${input.fromBranch} has no preview serving a version of ${tool.name}.`,
      );
    }
    const served = await registry.getVersion(preview.versionId);
    if (!served) throw new RegistryError("NOT_FOUND", `There is no version ${preview.versionId}.`);
    versionNumber = served.version;
  }
  if (versionNumber === undefined) {
    throw new RegistryError("INVALID", "Name a version, or the branch it is served from.");
  }
  const version = await registry.findVersion(tool.id, versionNumber);
  if (!version) {
    throw new RegistryError("NOT_FOUND", `The tool ${tool.name} has no version ${versionNumber}.`);
  }
  const record = await registry.getBuild(version.buildId);
  if (!record) throw new RegistryError("NOT_FOUND", `There is no build ${version.buildId}.`);

  const target = environments.find(
    (e) => e.name === input.to && (input.to !== "preview" || e.branch === input.branch),
  );
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

  // The changelog: production takes a version only if it covers the change (sdk.md §16).
  if (input.to === "production") {
    const changelog = record.changelog as Build["changelog"] | undefined;
    if (!changelog || changelog.entries.length === 0) {
      conflicts.push({
        code: "CHANGELOG_NO_ENTRY",
        message:
          "Production takes a version with a changelog entry: run `forgeron change`, then `forgeron release`.",
      });
    } else if (RANK[changelog.declared] < RANK[changelog.detected]) {
      conflicts.push({
        code: "CHANGELOG_IMPACT_TOO_LOW",
        message: `The changelog declares ${changelog.declared}, but the manifest changed by ${changelog.detected}: declare ${changelog.detected} or more.`,
      });
    }
    for (const waiting of await registry.unapproved(version.id)) {
      conflicts.push({
        code: "PENDING_APPROVAL",
        subject: waiting.resource,
        message: `${waiting.resource} waits for an admin to approve it before production.`,
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
      const db = await hosting.openDatabase({
        tool: tool.name,
        name: input.to,
        ...(input.branch ? { branch: input.branch } : {}),
      });
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
  const plan: PromotionPlan = {
    tool: tool.name,
    version: version.version,
    ...(input.fromBranch !== undefined ? { from: { branch: input.fromBranch } } : {}),
    to: {
      environment: input.to,
      ...(input.branch ? { branch: input.branch } : {}),
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
  return conflicts.length > 0 ? { ...plan, prompt: promotionPrompt(plan) } : plan;
}

/** What to do about each kind of conflict: the agent is told the rule, not only the symptom. */
const ADVICE: Record<PlanConflictCode, string> = {
  MIGRATION_MISSING:
    "The target's database has applied a migration this version does not have, usually because another branch added it and was promoted first. Bring that migration into this branch (rebase or merge the branch that added it), then regenerate this branch's own migration on top of it with `forgeron db generate` so the names and the order are consistent. Never delete or renumber a migration that was applied anywhere.",
  MIGRATION_EDITED:
    "A migration the target already applied has been edited in this version. Restore it to what was applied (use git to see the original) and put the new change in a new migration with `forgeron db generate`. An applied migration is never edited.",
  MIGRATION_OUT_OF_ORDER:
    "This version adds a migration whose name sorts before one the target already applied. Rename it so it comes after the last applied one, or regenerate it with `forgeron db generate` once the branch includes the applied ones. Check that it still makes sense on top of them.",
  CHANGELOG_NO_ENTRY:
    "Add the changelog entries with `forgeron change`, then cut the version with `forgeron release`, and deploy it again.",
  CHANGELOG_IMPACT_TOO_LOW:
    "Declare an impact at least as high as the one detected from the manifest in the change entries (`forgeron change --bump ...`), then release and deploy again.",
  PENDING_APPROVAL:
    "This version asks for resources production does not have. An administrator must approve them (console, Approvals, or the admin MCP `resources_approve`); this is a human decision.",
  NO_ARTIFACT:
    "The registry holds this build without its code. Deploy the branch again from CI so the code is recorded.",
};

/**
 * The text a person copies into an agent (or reads) when a promotion cannot go: it carries the tool, the
 * versions, each conflict with its details and the commands that inspect and fix it. The agent is told
 * what it must not do. Plain text, no value of any secret.
 */
export function promotionPrompt(plan: PromotionPlan): string {
  const where = plan.to.branch ? `${plan.to.environment} (${plan.to.branch})` : plan.to.environment;
  const source = plan.from
    ? `the branch ${plan.from.branch} (version ${plan.version})`
    : `version ${plan.version}`;
  const kinds = [...new Set(plan.conflicts.map((c) => c.code))];
  const lines: string[] = [
    `I want to promote the Forgeron tool "${plan.tool}" from ${source} to ${where}, and Forgeron refused. Help me fix it, step by step, and ask me before anything that changes data.`,
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
      `Migrations on ${where}: ${plan.migrations.applied.length ? plan.migrations.applied.join(", ") : "none applied"}. This version would apply: ${plan.migrations.pending.length ? plan.migrations.pending.join(", ") : "nothing"}${plan.migrations.destructive.length ? ` (destructive: ${plan.migrations.destructive.join(", ")})` : ""}.`,
    );
  }
  lines.push(
    "",
    "Useful commands (you are signed in with `forgeron login` as an administrator):",
    `- forgeron db status --env ${plan.to.environment}${plan.to.branch ? ` --branch ${plan.to.branch}` : ""}   what the target's database has applied`,
    `- forgeron db shell --env ${plan.to.environment} --sql "SELECT ..."   read the target's data (reads only unless I say otherwise)`,
    "- forgeron db generate   write a new migration from the schema",
    "- forgeron deploy --env preview --branch <branch>   build and deploy the branch again after the fix",
    `- forgeron promote --from-branch <branch> --to ${plan.to.environment}   ask again: it prints a new plan`,
    "",
    "Rules: never edit, delete or renumber a migration that has been applied anywhere. Never run a write or destructive statement on production without showing it to me and getting my yes. Do not guess a table or column: read the schema first. Tell me what you changed when you finish.",
  );
  return lines.join("\n");
}
