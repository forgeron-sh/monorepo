import { addresses } from "@forgeron/platform-contract/client";
import { parseArgs } from "node:util";
import { readCredentials } from "../credentials";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { readProject } from "../project";

const PROMOTE_USAGE =
  "Usage: forgeron promote <version> --to preview|production [--branch <name>] [--allow-destructive]";
const ROLLBACK_USAGE = "Usage: forgeron rollback [--env production|preview] [--branch <name>]";
const ENVIRONMENTS = ["preview", "production"];

/**
 * Who the CLI is to the gateway for promote and rollback (D-033): `FORGERON_TOKEN` (a deployment
 * token, CI) if set, else the token `forgeron login` stored. The gateway accepts a deployment
 * token of the tool, or an administrator.
 */
async function credentialsOf(io: Io): Promise<string> {
  const token = process.env.FORGERON_TOKEN || (await readCredentials(process.env, io.keychain));
  if (!token) {
    throw new UsageError(
      "Not signed in: run `forgeron login` (an administrator), or set FORGERON_TOKEN.",
    );
  }
  return token;
}

async function endpointOf(io: Io) {
  const project = await readProject(io.cwd);
  if (!project?.endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first.",
    );
  }
  return { project, endpoint: project.endpoint };
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
      "allow-destructive": { type: "boolean" },
    },
  });
  const [version] = positionals;
  if (!version || positionals.length > 1 || !values.to) throw new UsageError(PROMOTE_USAGE);
  if (!ENVIRONMENTS.includes(values.to)) {
    throw new UsageError(`--to ${values.to}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  if (values.to === "preview" && !values.branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  const { project, endpoint } = await endpointOf(io);
  const token = await credentialsOf(io);

  const answer = await platformClient(endpoint, token)(addresses.promote, {
    json: {
      tool: project.tool,
      version,
      to: values.to as "preview" | "production",
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
    `Promoted ${project.tool}@${promoted.version ?? version} to ${values.to}${promoted.url ? `: ${promoted.url}` : ""}`,
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
