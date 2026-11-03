import {
  addChange,
  BUMPS,
  CHANGE_TYPES,
  checkChanges,
  ChangelogError,
  release as releaseTool,
  type Bump,
  type ChangeType,
} from "@forgeron/compiler";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";

const CHANGE_USAGE = `Usage: forgeron change --type <${CHANGE_TYPES.join("|")}> --bump <${BUMPS.join("|")}> -m "<description>"
       forgeron change check`;

/** `forgeron change` and `forgeron change check` (sdk.md §16). */
export async function change(args: string[], io: Io): Promise<number> {
  if (args[0] === "check") {
    const { positionals } = parseArgs({ args: args.slice(1), allowPositionals: true, options: {} });
    if (positionals.length > 0) throw new UsageError(CHANGE_USAGE);
    const result = await checkChanges(io.cwd);
    if (!result.ok) {
      for (const problem of result.problems) io.error(problem);
      return 1;
    }
    io.log(
      result.detected === "none"
        ? "No change to declare."
        : `The declared impact (${result.declared}) covers the detected one (${result.detected}).`,
    );
    return 0;
  }

  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      type: { type: "string" },
      bump: { type: "string" },
      m: { type: "string", short: "m" },
    },
  });
  if (positionals.length > 0 || !values.type || !values.bump || !values.m) {
    throw new UsageError(CHANGE_USAGE);
  }
  if (!(CHANGE_TYPES as readonly string[]).includes(values.type))
    throw new UsageError(`--type ${values.type}: one of ${CHANGE_TYPES.join(", ")}.`);
  if (!(BUMPS as readonly string[]).includes(values.bump))
    throw new UsageError(`--bump ${values.bump}: one of ${BUMPS.join(", ")}.`);
  try {
    const file = await addChange(io.cwd, {
      type: values.type as ChangeType,
      bump: values.bump as Bump,
      description: values.m,
    });
    io.log(`Wrote ${file}.`);
    return 0;
  } catch (error) {
    if (error instanceof ChangelogError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  }
}

/** `forgeron release`: the new version, CHANGELOG.md, then a commit and the `<tool>@<version>` tag. */
export async function release(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { "no-git": { type: "boolean" } },
  });
  if (positionals.length > 0) throw new UsageError("Usage: forgeron release [--no-git]");
  try {
    const result = await releaseTool(io.cwd);
    io.log(
      `${result.name}@${result.version}: wrote CHANGELOG.md, package.json and emptied changes/.`,
    );
    if (values["no-git"]) return 0;
    const tag = `${result.name}@${result.version}`;
    for (const git of [
      ["add", "-A", "--", ...result.files],
      ["commit", "-m", `chore(release): ${tag}`],
      ["tag", tag],
    ]) {
      const code = await io.exec("git", git, io.cwd);
      if (code !== 0) {
        io.error(`git ${git[0]} failed (${code}): the files are written, finish by hand.`);
        return 1;
      }
    }
    io.log(`Committed and tagged ${tag}.`);
    return 0;
  } catch (error) {
    if (error instanceof ChangelogError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  }
}
