import { addresses } from "@forgeron/platform-contract/client";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { readProject } from "../project";
import { credentialsOf } from "../remote";

// A channel goes back to a version it served (D-125). There is no promotion between branches: a
// permanent channel takes the releases of the branch it follows, by itself or by an admin's update.

const ROLLBACK_USAGE =
  "Usage: forgeron rollback [--channel <name>] | --env preview --branch <name>";
const ENVIRONMENTS = ["preview", "production"];
const CHANNEL = /^[a-z][a-z0-9-]{0,29}$/;

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
 * `forgeron rollback [--channel <name>]`: the version the channel served before the current one
 * serves again (production by default; `--env preview --branch <b>` for a branch's temporary
 * channel). No migration is rolled back or applied: `forgeron db rollback` does that, on purpose.
 */
export async function rollback(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      env: { type: "string" },
      branch: { type: "string" },
      channel: { type: "string" },
    },
  });
  if (positionals.length > 0) throw new UsageError(ROLLBACK_USAGE);
  const env = values.env ?? "production";
  if (!ENVIRONMENTS.includes(env)) {
    throw new UsageError(`--env ${env}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  if (env === "preview" && !values.branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  const channel = values.channel === "production" ? undefined : values.channel;
  if (channel !== undefined && (env === "preview" || !CHANNEL.test(channel))) {
    throw new UsageError(`--channel ${channel}: the name of a permanent channel.`);
  }
  const { project, endpoint } = await endpointOf(io);
  const token = await credentialsOf(io);

  const answer = await platformClient(endpoint, token)(addresses.rollback, {
    json: {
      tool: project.tool,
      ...(channel
        ? { environment: "channel" as const, channel }
        : { environment: env as "preview" | "production" }),
      ...(values.branch && env === "preview" ? { branch: values.branch } : {}),
    },
  });
  if (answer.status !== 200) {
    io.error(refusal(answer));
    return 1;
  }
  io.log(`Rolled back ${project.tool} on ${channel ?? env} to ${answer.body.version}.`);
  io.log(
    "No migration was rolled back: use `forgeron db rollback` if the schema must go back too.",
  );
  return 0;
}
