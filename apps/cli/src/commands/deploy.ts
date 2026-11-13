import { ciBranch } from "../ci-branch";
import { buildTool } from "@forgeron/compiler";
import { addresses } from "@forgeron/platform-contract/client";
import { parseArgs } from "node:util";
import { readBuild } from "../built";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { ciCredential, deployEndpoint } from "../ci-credential";

const USAGE = "Usage: forgeron deploy [--branch <name>] [--allow-destructive]";

/** `1.5.0-preview.<branch>+a41f9e0`: a build carries its branch and its commit (docs/sdk.md §16). */
function versionOf(version: string, fingerprint: string, branch: string) {
  const build = fingerprint.slice(0, 7);
  const slug = branch.replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${version}-preview.${slug}+${build}`;
}

/**
 * The commit being deployed, for the console's list of branches: the sha CI gives (`GITHUB_SHA`) or
 * the checkout's, with its subject and author. Best effort: no git, no commit, the deploy goes on.
 */
async function commitOf(io: Io) {
  try {
    const out = io.capture
      ? await io.capture("git", ["log", "-1", "--format=%H%x1f%s%x1f%an"], io.cwd)
      : undefined;
    const [sha, message, author] = out?.code === 0 ? out.stdout.trim().split("\x1f") : [];
    const found = process.env.GITHUB_SHA || sha;
    if (!found || !/^[0-9a-f]{7,64}$/i.test(found)) return undefined;
    // The message and author are the checkout's, which is the commit only when it is the sha.
    const same = !sha || found === sha;
    return {
      sha: found,
      ...(same && message ? { message } : {}),
      ...(same && author ? { author } : {}),
    };
  } catch {
    return undefined;
  }
}

/**
 * `forgeron deploy`: builds the tool, uploads the build to the workspace's gateway with
 * `FORGERON_TOKEN` or GitHub Actions' identity (D-123), and prints where it is served. The build goes
 * to its branch's temporary channel (`--branch`, or the one GitHub gives CI). A release reaches the
 * permanent channels that follow the branch (D-125): there is no `--env production`. The platform
 * builds nothing: this is the build.
 */
export async function deploy(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      branch: { type: "string" },
      "allow-destructive": { type: "boolean" },
    },
  });
  if (positionals.length > 0) throw new UsageError(USAGE);
  const branch = values.branch || ciBranch();
  if (!branch) {
    throw new UsageError("A build goes to its branch: pass --branch <name>.");
  }
  const project = await deployEndpoint(io.cwd);
  const token = await ciCredential(project.endpoint);

  const built = await buildTool(io.cwd);
  const build = await readBuild(built.outDir, built.fingerprint);
  const version = versionOf(built.version, built.fingerprint, branch);
  const commit = await commitOf(io);

  const answer = await platformClient(project.endpoint, token)(addresses.deploy, {
    json: {
      branch,
      version,
      ...(commit ? { commit } : {}),
      ...(values["allow-destructive"] ? { allowDestructive: true } : {}),
      build: { ...build },
    },
  });
  if (answer.status !== 200) {
    io.error(refusal(answer));
    return 1;
  }
  const body = answer.body;

  io.log(
    `Deployed ${built.name}@${body?.version ?? version} to ${branch}${body?.url ? `: ${body.url}` : ""}`,
  );
  if (body?.applied?.length) io.log(`Migrations applied: ${body.applied.join(", ")}`);
  for (const reached of body?.channels ?? []) {
    io.log(
      "version" in reached
        ? `The channel ${reached.channel} took the release ${reached.version}.`
        : `The channel ${reached.channel} waits for approval: ${reached.waiting}`,
    );
  }
  return 0;
}
