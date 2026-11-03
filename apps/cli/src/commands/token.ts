import { parseArgs } from "node:util";
import { readCredentials } from "../credentials";
import { UsageError, type Io } from "../io";
import { readProject } from "../project";

const USAGE = "Usage: forgeron token create --name <name> --scope deploy [--days 90]";

// The lifetime is the gateway's to bound (1 to 365 days); this is only what is asked by default.
const DEFAULT_DAYS = 90;

/**
 * `forgeron token create --name ci --scope deploy`: asks the workspace for a deployment token for
 * this tool and prints it once. It goes into the CI secret `FORGERON_TOKEN` (sdk.md §4, §15).
 * Creating one takes an administrator's credentials, not another deployment token.
 */
export async function token(args: string[], io: Io): Promise<number> {
  const [sub, ...rest] = args;
  if (sub !== "create") throw new UsageError(USAGE);
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      name: { type: "string" },
      scope: { type: "string" },
      days: { type: "string" },
    },
  });
  if (positionals.length > 0 || !values.name || !values.scope) throw new UsageError(USAGE);
  if (values.scope !== "deploy") {
    throw new UsageError(`"${values.scope}" is not a scope: "deploy" is the only one.`);
  }
  const days = values.days === undefined ? DEFAULT_DAYS : Number(values.days);
  if (!Number.isInteger(days) || days < 1) {
    throw new UsageError("--days is a whole number of days, at least 1.");
  }

  const project = await readProject(io.cwd);
  if (!project?.endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first.",
    );
  }
  const credentials = await readCredentials(process.env, io.keychain);
  if (!credentials) {
    throw new UsageError("Not signed in: run `forgeron login` first.");
  }

  const response = await fetch(new URL("/deploy-tokens", project.endpoint), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${credentials}` },
    body: JSON.stringify({ tool: project.tool, name: values.name, scope: values.scope, days }),
  });
  const body = (await response.json().catch(() => undefined)) as
    | { token?: string; expiresAt?: string; error?: { message?: string } }
    | undefined;
  if (!response.ok || !body?.token) {
    io.error(body?.error?.message ?? `The workspace answered ${response.status}.`);
    return 1;
  }

  io.log(`Deployment token "${values.name}" for ${project.tool}, valid until ${body.expiresAt}.`);
  io.log("It is shown once: store it as the CI secret FORGERON_TOKEN.");
  io.log("");
  io.log(body.token);
  return 0;
}
