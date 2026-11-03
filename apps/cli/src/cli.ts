import { build } from "./commands/build";
import { catalog } from "./commands/catalog";
import { change, release } from "./commands/change";
import { db } from "./commands/db";
import { deploy } from "./commands/deploy";
import { dev } from "./commands/dev";
import { init } from "./commands/init";
import { install } from "./commands/install";
import { link } from "./commands/link";
import { login, logout, whoami } from "./commands/login";
import { platform } from "./commands/platform";
import { play } from "./commands/play";
import { preview } from "./commands/preview";
import { promote, rollback } from "./commands/promote";
import { secrets } from "./commands/secrets";
import { test } from "./commands/test";
import { token } from "./commands/token";
import { NotFoundError, UsageError, type Io } from "./io";

const COMMANDS: Record<string, (args: string[], io: Io) => Promise<number>> = {
  init,
  catalog,
  install,
  link,
  login,
  logout,
  whoami,
  build,
  test,
  dev,
  play,
  platform,
  db,
  change,
  release,
  deploy,
  preview,
  promote,
  rollback,
  secrets,
  token,
};

const USAGE = `Usage: forgeron <command>

  init [name] [--template <name>]      create a tool, from scratch or from a template
  catalog search <text>                search the template catalog
  install <template> [--name <tool>]   show the requested resources, then install after approval
  link --workspace <name>              link the tool to a workspace
  login [--workspace <name>]           sign in through the workspace SSO in the browser
  logout | whoami                      forget the stored token | show who it is
  dev [--as <role>] [--port 8787]      run the tool locally
  play [--template <name>] [--as <role>] [--port 8788]
                                       open the playground of the tool, or of a template without installing it
  platform install --account <id> --domain <d> --gateway <worker.js>
                                       install the platform on your Cloudflare account (self-host)
  db generate|migrate|status|rollback|seed|shell
                                       the database: migrations, seed, SQL (forgeron db for details)
  change --type <t> --bump <b> -m ".."  add a change to changes/ (change check: CI)
  secrets set <NAME> [--env] | list [--env]
                                       tool secrets of an environment (the value is typed, never an argument)
  deploy [--env preview|pilot|production] [--group <name>]
                                       build, upload to the gateway with FORGERON_TOKEN
  promote <version> --to <env> [--group <name>]
                                       put an existing version on another environment, no rebuild
  rollback [--env production]          put the previous version of an environment back on traffic
  preview close [--branch <name>]      tear down the preview of a branch (FORGERON_TOKEN)
  release [--no-git]                   next version, CHANGELOG.md, tag
  token create --name <n> --scope deploy  create a deployment token for CI (FORGERON_TOKEN)
  test [vitest args]                   build the tool, then run Vitest
  build                                build every tool under this folder`;

/** Runs a command and returns the exit code: 0, 1 for a failure, 2 for a wrong use, 4 for something not found (sdk.md §5). */
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
    if (error instanceof NotFoundError) {
      io.error(error.message);
      return 4;
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
