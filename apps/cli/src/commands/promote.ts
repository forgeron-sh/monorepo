import { addresses } from "@forgeron/platform-contract/client";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { readProject } from "../project";
import { credentialsOf } from "../remote";

const PROMOTE_USAGE = `Usage: forgeron promote <version> --to preview|production [--branch <name>] [--allow-destructive]
       forgeron promote --from-branch <name> --to production [--allow-destructive] [--dry-run] [--prompt-file <path>]`;
const ROLLBACK_USAGE = "Usage: forgeron rollback [--env production|preview] [--branch <name>]";
const ENVIRONMENTS = ["preview", "production"];

async function endpointOf(io: Io) {
  const project = await readProject(io.cwd);
  if (!project?.endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first.",
    );
  }
  return { project, endpoint: project.endpoint };
}

/** The exit code of a promotion that was refused for conflicts: not an error of the tool, not a wrong use. */
const CONFLICTS = 3;

/** What the CLI reads of a plan (`POST /promote/plan`). */
interface Plan {
  tool: string;
  version: string;
  to: { environment: string; branch?: string; currentVersion?: string };
  alreadyServed: boolean;
  ok: boolean;
  conflicts: Array<{ code: string; subject?: string; message: string }>;
  requiresAllowDestructive: boolean;
  migrations: { checked: boolean; pending: string[]; destructive: string[] };
  changes: Array<{ impact: string; subject: string; detail?: string }>;
  prompt?: string;
}

/** What stops a promotion, the way out, and the prompt an agent can be given. */
function printConflicts(
  io: Io,
  plan: Plan & {
    conflicts: Array<{ code: string; subject?: string; message: string }>;
    prompt?: string;
  },
) {
  const where = plan.to.branch ? `${plan.to.environment} (${plan.to.branch})` : plan.to.environment;
  io.error(
    `${plan.tool}@${plan.version} cannot go to ${where} yet: ${plan.conflicts.length} problem${plan.conflicts.length === 1 ? "" : "s"}.`,
  );
  for (const c of plan.conflicts) {
    io.error(`  - ${c.code}${c.subject ? ` (${c.subject})` : ""}: ${c.message}`);
  }
  io.error("");
  io.error(
    "Fix them with the CLI (`forgeron db status --env production` shows what the database has applied), or hand them to an agent: copy the prompt below into Claude Code or your agent, in this tool's folder.",
  );
  if (plan.prompt) {
    io.error("");
    io.error("----- prompt -----");
    io.error(plan.prompt);
    io.error("----- end of prompt -----");
  }
}

/**
 * `forgeron promote <version> --to <env>`: puts a version the workspace already holds on another
 * environment, with no rebuild. The gateway applies the rules of a deployment: the changelog must
 * cover the change and a destructive migration needs `--allow-destructive`.
 */
export async function promote(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      to: { type: "string" },
      branch: { type: "string" },
      "from-branch": { type: "string" },
      "dry-run": { type: "boolean" },
      "prompt-file": { type: "string" },
      "allow-destructive": { type: "boolean" },
    },
  });
  const [version] = positionals;
  const fromBranch = values["from-branch"];
  // Exactly one of a version and a branch to take it from.
  if (
    positionals.length > 1 ||
    !values.to ||
    (version === undefined) === (fromBranch === undefined)
  ) {
    throw new UsageError(PROMOTE_USAGE);
  }
  if (values["dry-run"] && fromBranch === undefined && version === undefined) {
    throw new UsageError(PROMOTE_USAGE);
  }
  if (!ENVIRONMENTS.includes(values.to)) {
    throw new UsageError(`--to ${values.to}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  if (values.to === "preview" && !values.branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  const { project, endpoint } = await endpointOf(io);
  const token = await credentialsOf(io);
  const client = platformClient(endpoint, token);
  const target = values.to as "preview" | "production";
  const source = fromBranch !== undefined ? { fromBranch } : { version: version! };

  // From a branch, or asked to only look: the plan first (D-113). It says whether the version can go,
  // and what stops it; nothing moves unless there is no conflict.
  if (fromBranch !== undefined || values["dry-run"]) {
    const planned = await client(addresses.promotionPlan, {
      json: {
        tool: project.tool,
        ...source,
        to: target,
        ...(values.branch ? { branch: values.branch } : {}),
      },
    });
    if (planned.status !== 200) {
      io.error(refusal(planned));
      return 1;
    }
    const plan = planned.body;
    if (!plan.ok) {
      printConflicts(io, plan);
      if (values["prompt-file"] && plan.prompt) {
        const file = resolve(io.cwd, values["prompt-file"]);
        await writeFile(file, `${plan.prompt}\n`);
        io.log(`The prompt was written to ${file}.`);
      }
      return CONFLICTS;
    }
    if (plan.alreadyServed) {
      io.log(`${target} already serves ${project.tool}@${plan.version}: nothing to promote.`);
      return 0;
    }
    io.log(
      `${project.tool}@${plan.version} can go to ${target}${plan.to.currentVersion ? ` (it serves ${plan.to.currentVersion})` : ""}.`,
    );
    if (plan.migrations.checked || plan.migrations.pending.length > 0) {
      io.log(
        plan.migrations.pending.length
          ? `  Migrations to apply: ${plan.migrations.pending.join(", ")}`
          : "  No migration to apply.",
      );
    }
    for (const change of plan.changes) {
      io.log(
        `  ${change.impact.padEnd(5)} ${change.subject}${change.detail ? `: ${change.detail}` : ""}`,
      );
    }
    if (plan.requiresAllowDestructive && !values["allow-destructive"]) {
      io.error(
        `It drops or rewrites data (${plan.migrations.destructive.join(", ")}): read those migrations, then run again with --allow-destructive.`,
      );
      return 1;
    }
    if (values["dry-run"]) return 0;
  }

  const answer = await client(addresses.promote, {
    json: {
      tool: project.tool,
      ...source,
      to: target,
      ...(values.branch ? { branch: values.branch } : {}),
      ...(values["allow-destructive"] ? { allowDestructive: true } : {}),
    },
  });
  if (answer.status !== 200) {
    io.error(refusal(answer));
    return 1;
  }
  const promoted = answer.body;
  io.log(
    `Promoted ${project.tool}@${promoted.version ?? version ?? ""} to ${values.to}${promoted.url ? `: ${promoted.url}` : ""}`,
  );
  if (promoted.applied?.length) io.log(`Migrations applied: ${promoted.applied.join(", ")}`);
  return 0;
}

/**
 * `forgeron rollback [--env production]`: the version the environment served before the current
 * one serves again. No migration is rolled back or applied: `forgeron db rollback` does that, on
 * purpose.
 */
export async function rollback(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { env: { type: "string" }, branch: { type: "string" } },
  });
  if (positionals.length > 0) throw new UsageError(ROLLBACK_USAGE);
  const env = values.env ?? "production";
  if (!ENVIRONMENTS.includes(env)) {
    throw new UsageError(`--env ${env}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  if (env === "preview" && !values.branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  const { project, endpoint } = await endpointOf(io);
  const token = await credentialsOf(io);

  const answer = await platformClient(endpoint, token)(addresses.rollback, {
    json: {
      tool: project.tool,
      environment: env as "preview" | "production",
      ...(values.branch ? { branch: values.branch } : {}),
    },
  });
  if (answer.status !== 200) {
    io.error(refusal(answer));
    return 1;
  }
  io.log(`Rolled back ${project.tool} on ${env} to ${answer.body.version}.`);
  io.log(
    "No migration was rolled back: use `forgeron db rollback` if the schema must go back too.",
  );
  return 0;
}
