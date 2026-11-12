import { ciBranch } from "../ci-branch";
import { addresses } from "@forgeron/platform-contract/client";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { ciCredential, deployEndpoint } from "../ci-credential";

const USAGE = "Usage: forgeron preview close [--branch <name>]";

/**
 * `forgeron preview close`: tears down the preview of a branch (a merged or closed pull request)
 * with `FORGERON_TOKEN`, or GitHub Actions' identity (D-123). The branch is `--branch`, or the one GitHub gives CI: on a pull request
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
  const branch = values.branch ?? (process.env.FORGERON_BRANCH || undefined) ?? ciBranch();
  if (!branch) throw new UsageError("Which preview? Pass --branch <name>.");
  const project = await deployEndpoint(io.cwd);
  const token = await ciCredential(project.endpoint);

  const answer = await platformClient(project.endpoint, token)(addresses.closePreview, {
    json: { branch },
  });
  if (answer.status !== 200) {
    io.error(refusal(answer));
    return 1;
  }
  // The gateway says `removed` (the CLI used to read `closed`, so it always reported no preview).
  const tool = project.tool ?? answer.body.tool;
  io.log(
    answer.body.removed
      ? `Closed the preview of ${tool} for ${branch}.`
      : `${tool} had no preview for ${branch}.`,
  );
  return 0;
}
