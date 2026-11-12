import { admin, api } from "./commands/admin";
import { build } from "./commands/build";
import { bundle } from "./commands/bundle";
import { catalog } from "./commands/catalog";
import { change, release } from "./commands/change";
import { db } from "./commands/db";
import { deploy } from "./commands/deploy";
import { dev } from "./commands/dev";
import { init } from "./commands/init";
import { VERSION } from "./version";
import { install } from "./commands/install";
import { link } from "./commands/link";
import { login, logout, whoami } from "./commands/login";
import { platform } from "./commands/platform";
import { play } from "./commands/play";
import { preview } from "./commands/preview";
import { rollback } from "./commands/rollback";
import { secrets } from "./commands/secrets";
import { test } from "./commands/test";
import { token } from "./commands/token";
import { NotFoundError, UsageError, type Io } from "./io";

const COMMANDS: Record<string, (args: string[], io: Io) => Promise<number>> = {
  init,
  admin,
  api,
  catalog,
  install,
  link,
  login,
  logout,
  whoami,
  build,
  bundle,
  test,
  dev,
  play,
  platform,
  db,
  change,
  release,
  deploy,
  preview,
  rollback,
  secrets,
  token,
};

const USAGE = `Usage: forgeron <command>

  init [name] [--template <name>]      create a tool, from scratch or from a template
  init marketplace [name]              create a marketplace of tools
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
                                       the database: migrations, seed, SQL; status and shell also on
                                       --env preview|production (administrators)
  admin <area> <verb>                  the workspace's admin operations: tools, approvals, members, audit,
                                       people's secrets, re-sealing (forgeron admin for details)
  api <METHOD> <path>                  call any route of the console API with your token, like gh api
  change --type <t> --bump <b> -m ".."  add a change to changes/ (change check: CI)
  secrets set <NAME> [--env] | list [--env]
                                       tool secrets of an environment (the value is typed, never an argument)
  deploy [--branch <name>]             build the branch and send it to its temporary channel (CI); a
                                       release reaches the permanent channels that follow the branch
  rollback [--channel <name>]          put the previous version of a permanent channel back on traffic
  preview close [--branch <name>]      tear down the preview of a branch (FORGERON_TOKEN)
  release [--no-git]                   next version, CHANGELOG.md, tag
  token create --name <n> --scope deploy  create a deployment token for CI (FORGERON_TOKEN)
  test [vitest args]                   build the tool, then run Vitest
  build                                build every tool under this folder
  bundle [--out <dir>]                 build the tool into one file, for a marketplace release`;

/** Runs a command and returns the exit code: 0, 1 for a failure, 2 for a wrong use, 4 for something not found (sdk.md §5). */
export async function run(argv: string[], io: Io): Promise<number> {
  const [name, ...args] = argv;
  if (name === "--version" || name === "-v") {
    io.log(`forgeron ${VERSION}`);
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
