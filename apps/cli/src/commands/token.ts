import { addresses } from "@forgeron/platform-contract/client";
import { parseArgs } from "node:util";
import { readCredentials } from "../credentials";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { readProject, resolveEndpoint } from "../project";

const USAGE = "Usage: forgeron token create --name <name> --scope deploy [--days 90]";

// The lifetime is the gateway's to bound (1 to 365 days); this is only what is asked by default.
const DEFAULT_DAYS = 90;

/**
 * `forgeron token create --name ci --scope deploy`: asks the workspace for a deployment token for
 * this tool and prints it once. It goes into the CI secret `FORGERON_TOKEN` (sdk.md §4, §15).
 * Creating one takes a signed-in person's credentials with the permission for it, not another deployment token.
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
      workspace: { type: "string" },
      endpoint: { type: "string" },
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
  if (!project) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first.",
    );
  }
  const endpoint = await resolveEndpoint(values, io.cwd);
  const credentials = await readCredentials(process.env, io.keychain);
  if (!credentials) {
    throw new UsageError("Not signed in: run `forgeron login` first.");
  }

  const answer = await platformClient(endpoint, credentials)(addresses.createDeployToken, {
    json: { tool: project.tool, name: values.name, scope: "deploy", days },
  });
  if (answer.status !== 201 || !answer.body?.token) {
    io.error(refusal(answer));
    return 1;
  }
  const body = answer.body;

  io.log(`Deployment token "${values.name}" for ${project.tool}, valid until ${body.expiresAt}.`);
  io.log("It is shown once: store it as the CI secret FORGERON_TOKEN.");
  io.log("");
  io.log(body.token);
  return 0;
}
