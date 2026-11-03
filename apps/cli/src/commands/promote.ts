import { parseArgs } from "node:util";
import { readCredentials } from "../credentials";
import { UsageError, type Io } from "../io";
import { readProject } from "../project";

const PROMOTE_USAGE =
  "Usage: forgeron promote <version> --to preview|pilot|production [--group <name>] [--branch <name>] [--allow-destructive]";
const ROLLBACK_USAGE =
  "Usage: forgeron rollback [--env pilot|production|preview] [--branch <name>]";
const ENVIRONMENTS = ["preview", "pilot", "production"];

/**
 * Who the CLI is to the gateway for promote and rollback (D-033): `FORGERON_TOKEN` (a deployment
 * token, CI) if set, else the token `forgeron login` stored. The gateway accepts a deployment
 * token of the tool, or an administrator.
 */
async function credentialsOf(): Promise<string> {
  const token = process.env.FORGERON_TOKEN || (await readCredentials());
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

async function call(endpoint: string, path: string, token: string, body: unknown) {
  const response = await fetch(new URL(path, endpoint), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const answer = (await response.json().catch(() => undefined)) as
    | {
        version?: string;
        url?: string;
        applied?: string[];
        group?: string;
        error?: { message?: string };
      }
    | undefined;
  return { ok: response.ok, status: response.status, answer };
}

/**
 * `forgeron promote <version> --to <env>`: puts a version the workspace already holds on another
 * environment, with no rebuild. The gateway applies the rules of a deployment: the changelog must
 * cover the change, a destructive migration needs `--allow-destructive`, and the migrations must
 * be compatible with the database the environment shares (D-021).
 */
export async function promote(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      to: { type: "string" },
      group: { type: "string" },
      branch: { type: "string" },
      "allow-destructive": { type: "boolean" },
    },
  });
  const [version] = positionals;
  if (!version || positionals.length > 1 || !values.to) throw new UsageError(PROMOTE_USAGE);
  if (!ENVIRONMENTS.includes(values.to)) {
    throw new UsageError(`--to ${values.to}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  if (values.group && values.to !== "pilot") {
    throw new UsageError("--group is for the pilot: only the pilot has a group.");
  }
  if (values.to === "preview" && !values.branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  const { project, endpoint } = await endpointOf(io);
  const token = await credentialsOf();

  const { ok, status, answer } = await call(endpoint, "/promote", token, {
    tool: project.tool,
    version,
    to: values.to,
    ...(values.branch ? { branch: values.branch } : {}),
    ...(values.group ? { group: values.group } : {}),
    ...(values["allow-destructive"] ? { allowDestructive: true } : {}),
  });
  if (!ok) {
    io.error(answer?.error?.message ?? `The workspace answered ${status}.`);
    return 1;
  }
  io.log(
    `Promoted ${project.tool}@${answer?.version ?? version} to ${values.to}${answer?.url ? `: ${answer.url}` : ""}`,
  );
  if (answer?.group) io.log(`Served to the group "${answer.group}" at the production address.`);
  if (answer?.applied?.length) io.log(`Migrations applied: ${answer.applied.join(", ")}`);
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
  const token = await credentialsOf();

  const { ok, status, answer } = await call(endpoint, "/rollback", token, {
    tool: project.tool,
    environment: env,
    ...(values.branch ? { branch: values.branch } : {}),
  });
  if (!ok) {
    io.error(answer?.error?.message ?? `The workspace answered ${status}.`);
    return 1;
  }
  io.log(`Rolled back ${project.tool} on ${env} to ${answer?.version}.`);
  io.log(
    "No migration was rolled back: use `forgeron db rollback` if the schema must go back too.",
  );
  return 0;
}
