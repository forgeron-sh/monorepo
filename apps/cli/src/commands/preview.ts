import { addresses } from "@forgeron/platform-contract/client";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { readProject } from "../project";

const USAGE = "Usage: forgeron preview close [--branch <name>]";

/**
 * `forgeron preview close`: tears down the preview of a branch (a merged or closed pull request)
 * with `FORGERON_TOKEN`. The branch is `--branch`, or the one GitHub gives CI: on a pull request
 * `GITHUB_HEAD_REF`, the same name `forgeron deploy` used. A branch with no preview is not an error.
 */
export async function preview(args: string[], io: Io): Promise<number> {
  const [action, ...rest] = args;
  if (action !== "close") throw new UsageError(USAGE);
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: { branch: { type: "string" } },
  });
  if (positionals.length > 0) throw new UsageError(USAGE);
  // `FORGERON_BRANCH`: the deleted branch's name, which the action passes on (D-121).
  const branch =
    values.branch ??
    (process.env.FORGERON_BRANCH || undefined) ??
    process.env.GITHUB_HEAD_REF ??
    process.env.GITHUB_REF_NAME;
  if (!branch) throw new UsageError("Which preview? Pass --branch <name>.");
  const token = process.env.FORGERON_TOKEN;
  if (!token) {
    throw new UsageError(
      "FORGERON_TOKEN is not set: create a deployment token with `forgeron token create`.",
    );
  }
  const project = await readProject(io.cwd);
  if (!project?.endpoint) {
    throw new UsageError(
      "This tool is not linked to a workspace: run `forgeron link --workspace <name>` first.",
    );
  }

  const answer = await platformClient(project.endpoint, token)(addresses.closePreview, {
    json: { branch },
  });
  if (answer.status !== 200) {
    io.error(refusal(answer));
    return 1;
  }
  // The gateway says `removed` (the CLI used to read `closed`, so it always reported no preview).
  io.log(
    answer.body.removed
      ? `Closed the preview of ${project.tool} for ${branch}.`
      : `${project.tool} had no preview for ${branch}.`,
  );
  return 0;
}
