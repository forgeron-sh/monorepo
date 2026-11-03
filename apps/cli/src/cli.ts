import { build } from "./commands/build";
import { catalog } from "./commands/catalog";
import { change, release } from "./commands/change";
import { db } from "./commands/db";
import { dev } from "./commands/dev";
import { init } from "./commands/init";
import { install } from "./commands/install";
import { link } from "./commands/link";
import { play } from "./commands/play";
import { test } from "./commands/test";
import { token } from "./commands/token";
import { UsageError, type Io } from "./io";

const COMMANDS: Record<string, (args: string[], io: Io) => Promise<number>> = {
  init,
  catalog,
  install,
  link,
  build,
  test,
  dev,
  play,
  db,
  change,
  release,
  token,
};

const USAGE = `Usage: forgeron <command>

  init [name] [--template <name>]      create a tool, from scratch or from a template
  catalog search <text>                search the template catalog
  install <template> [--name <tool>]   show the requested resources, then install after approval
  link --workspace <name>              link the tool to a workspace
  dev [--as <role>] [--port 8787]      run the tool locally
  play [--as <role>] [--port 8788]     open the playground of the tool
  db generate|migrate|status|rollback|seed|shell
                                       the database: migrations, seed, SQL (forgeron db for details)
  change --type <t> --bump <b> -m ".."  add a change to changes/ (change check: CI)
  release [--no-git]                   next version, CHANGELOG.md, tag
  token create --name <n> --scope deploy  create a deployment token for CI (FORGERON_TOKEN)
  test [vitest args]                   build the tool, then run Vitest
  build                                build every tool under this folder`;

/** Runs a command and returns the exit code: 0, 1 for a failure, 2 for a wrong use (sdk.md §5). */
export async function run(argv: string[], io: Io): Promise<number> {
  const [name, ...args] = argv;
  if (name === "--version" || name === "-v") {
    io.log("forgeron 0.0.0");
    return 0;
  }
  const command = name ? COMMANDS[name] : undefined;
  if (!command) {
    io.error(name ? `forgeron: unknown command "${name}".\n\n${USAGE}` : USAGE);
    return name ? 2 : 0;
  }
  try {
    return await command(args, io);
  } catch (error) {
    if (error instanceof UsageError) {
      io.error(error.message);
      return 2;
    }
    // `parseArgs` rejects an unknown flag with its own error: that is a wrong use too.
    if (
      error instanceof TypeError &&
      (error as { code?: string }).code?.startsWith("ERR_PARSE_ARGS")
    ) {
      io.error(error.message);
      return 2;
    }
    io.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
