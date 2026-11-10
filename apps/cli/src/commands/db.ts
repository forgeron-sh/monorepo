import {
  buildTool,
  generateMigration,
  MigrationGenerationError,
  runSeed,
} from "@forgeron/compiler";
import {
  applyMigrations,
  migrationStatus,
  revertMigrations,
  MigrationError,
} from "@forgeron/hosting";
import type { BuildMigration } from "@forgeron/hosting";
import { openLocalDatabase } from "@forgeron/hosting/local";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { addresses } from "@forgeron/platform-contract/client";
import { UsageError, type Io } from "../io";
import { consoleClient, consoleRefusal, credentialsOf, toolOf, workspaceOf } from "../remote";

const USAGE = `Usage: forgeron db <generate|migrate|status|rollback|seed|shell>
  generate [--name <name>]
  migrate  [--env local]
  status   [--env local|preview|production] [--branch <name>]
  rollback [--env local] [--steps 1]
  seed
  shell    [--env local|preview|production] [--branch <name>] --sql <statement> [--write] [--confirm <tool>]

On preview and production (administrators, signed in with \`forgeron login\`): status compares the
migrations of the version the environment serves with its database; shell runs one statement. A read
runs as it is; a write needs --write, and on production --confirm <tool> (the tool's name). Every
statement is recorded in the audit log before it runs. Outside a tool's folder: --tool and --endpoint.`;

/** Statements that only read. */
const READ_ONLY = /^\s*(select|explain|pragma\s+table_info|pragma\s+index_list|with)\b/i;

async function builtMigrations(dir: string): Promise<BuildMigration[]> {
  const { outDir } = await buildTool(dir);
  try {
    return JSON.parse(await readFile(join(outDir, "migrations.json"), "utf8")) as BuildMigration[];
  } catch {
    return [];
  }
}

/**
 * The shell is read-only outside local; writing there takes `--write` and the `admin` role (sdk.md §5).
 * Local is the developer's own database: they may write.
 */
export function checkShell(
  env: string,
  sql: string,
  options: { write: boolean; role: string | undefined },
): void {
  if (env === "local") return;
  const reads = READ_ONLY.test(sql) && !sql.includes(";");
  if (reads) return;
  if (!options.write)
    throw new UsageError(`This statement writes: ${env} is read-only unless you pass --write.`);
  if (options.role !== "admin")
    throw new UsageError(`Writing on ${env} takes the admin role (--as admin).`);
}

/** `forgeron db ...` (docs/sdk.md §5). */
export async function db(args: string[], io: Io): Promise<number> {
  const [sub, ...rest] = args;
  if (sub === undefined) throw new UsageError(USAGE);
  if (!["generate", "migrate", "status", "rollback", "seed", "shell"].includes(sub))
    throw new UsageError(`forgeron db: unknown subcommand "${sub}".\n${USAGE}`);

  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      name: { type: "string" },
      env: { type: "string" },
      steps: { type: "string" },
      sql: { type: "string" },
      write: { type: "boolean" },
      as: { type: "string" },
      branch: { type: "string" },
      confirm: { type: "string" },
      tool: { type: "string" },
      endpoint: { type: "string" },
    },
  });
  if (positionals.length > 0) throw new UsageError(USAGE);

  if (sub === "generate") return generate(values.name, io);

  const env = values.env ?? "local";
  if (env !== "local") return remote(sub, env, values, io);
  if (sub === "shell") {
    if (values.sql === undefined)
      throw new UsageError("forgeron db shell: pass --sql <statement>.");
    checkShell(env, values.sql, { write: values.write === true, role: values.as });
  }
  const database = await openLocalDatabase(join(io.cwd, ".forgeron", "local"));
  try {
    switch (sub) {
      case "migrate": {
        const { applied } = await applyMigrations(database.d1, await builtMigrations(io.cwd), {
          allowDestructive: true,
        });
        io.log(applied.length ? `Applied ${applied.join(", ")}.` : "Nothing to apply.");
        return 0;
      }
      case "status": {
        const { applied, pending } = await migrationStatus(
          database.d1,
          await builtMigrations(io.cwd),
        );
        for (const name of applied) io.log(`applied  ${name}`);
        for (const name of pending) io.log(`pending  ${name}`);
        if (applied.length + pending.length === 0) io.log("No migration.");
        return 0;
      }
      case "rollback": {
        const steps = values.steps === undefined ? 1 : Number(values.steps);
        if (!Number.isInteger(steps) || steps < 1)
          throw new UsageError(`--steps ${values.steps}: not a positive number.`);
        const reverted = await revertMigrations(database.d1, await builtMigrations(io.cwd), {
          steps,
        });
        io.log(reverted.length ? `Reverted ${reverted.join(", ")}.` : "Nothing to revert.");
        return 0;
      }
      case "seed": {
        const migrations = await builtMigrations(io.cwd);
        await applyMigrations(database.d1, migrations, { allowDestructive: true });
        if (!(await runSeed(io.cwd, database.d1 as never))) {
          io.error("This tool has no db/seed.ts.");
          return 1;
        }
        io.log("Seeded the local database.");
        return 0;
      }
      default: {
        const { results = [] } = await (
          database.d1 as never as {
            prepare(sql: string): { all(): Promise<{ results?: unknown[] }> };
          }
        )
          .prepare(values.sql as string)
          .all();
        io.log(JSON.stringify(results, null, 2));
        return 0;
      }
    }
  } catch (error) {
    if (error instanceof MigrationError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  } finally {
    await database.close();
  }
}

async function generate(name: string | undefined, io: Io): Promise<number> {
  try {
    const result = await generateMigration(io.cwd, name === undefined ? {} : { name });
    if (!result) {
      io.log("The schema has not changed since the last migration: nothing to generate.");
      return 0;
    }
    io.log(
      `Wrote ${result.file} (${result.statements} statement${result.statements === 1 ? "" : "s"}).`,
    );
    if (result.destructive)
      io.log(
        "  It drops or rewrites data: it is marked destructive. Read it before you commit it.",
      );
    if (!result.reversible)
      io.log("  Its way back could not be written: it cannot be undone automatically.");
    io.log(
      "  Read it, add data statements if the change needs them, then commit it with db/migrations/meta/snapshot.json.",
    );
    return 0;
  } catch (error) {
    // A change the generator will not write safely is not a wrong use: say what to do instead.
    if (error instanceof MigrationGenerationError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  }
}

interface RemoteFlags {
  sql?: string | undefined;
  write?: boolean | undefined;
  confirm?: string | undefined;
  branch?: string | undefined;
  tool?: string | undefined;
  endpoint?: string | undefined;
}

/** What `status` and `shell` do on a preview or production database (D-112): through the workspace. */
async function remote(sub: string, env: string, values: RemoteFlags, io: Io): Promise<number> {
  if (env !== "preview" && env !== "production") {
    throw new UsageError(`--env ${env}: one of local, preview, production.`);
  }
  if (sub !== "status" && sub !== "shell") {
    throw new UsageError(
      `forgeron db ${sub}: on ${env} only status and shell are available. Migrations are applied by a deployment.`,
    );
  }
  if (env === "preview" && !values.branch) {
    throw new UsageError("A preview is tied to a branch: pass --branch <name>.");
  }
  if (sub === "shell" && values.sql === undefined) {
    throw new UsageError("forgeron db shell: pass --sql <statement>.");
  }
  // A write that was not asked for stops here, before reaching the workspace (which checks it again).
  if (
    sub === "shell" &&
    values.write !== true &&
    !(READ_ONLY.test(values.sql!) && !values.sql!.includes(";"))
  ) {
    throw new UsageError(`This statement writes: ${env} is read-only unless you pass --write.`);
  }
  const { endpoint, project } = await workspaceOf(io, values.endpoint);
  const tool = toolOf(project, values.tool);
  const client = consoleClient(endpoint, await credentialsOf(io));

  if (sub === "status") {
    const answer = await client(addresses.dbMigrations, {
      params: { tool },
      query: { env, ...(values.branch ? { branch: values.branch } : {}) },
    });
    if (answer.status !== 200) {
      io.error(consoleRefusal(answer));
      return 1;
    }
    const status = answer.body;
    io.log(
      `${tool} on ${status.environment}${status.branch ? ` (${status.branch})` : ""}, serving ${status.version ?? "nothing"}`,
    );
    for (const name of status.applied) io.log(`applied  ${name}`);
    for (const name of status.pending) {
      io.log(
        `pending  ${name}${status.destructive.includes(name) ? "  (drops or rewrites data)" : ""}`,
      );
    }
    if (status.applied.length + status.pending.length === 0) io.log("No migration.");
    for (const c of status.conflicts) io.log(`conflict ${c.code} ${c.migration}: ${c.message}`);
    // The same exit code as a promotion refused for conflicts: something to fix, not a failure of the tool.
    return status.conflicts.length > 0 ? 3 : 0;
  }

  const answer = await client(addresses.dbQuery, {
    params: { tool },
    json: {
      sql: values.sql!,
      env,
      ...(values.branch ? { branch: values.branch } : {}),
      ...(values.write ? { write: true } : {}),
      ...(values.confirm ? { confirm: values.confirm } : {}),
    },
  });
  if (answer.status !== 200) {
    io.error(consoleRefusal(answer));
    return 1;
  }
  io.log(JSON.stringify(answer.body.rows, null, 2));
  if (answer.body.truncated) {
    io.error(`${answer.body.rowCount} rows: only the first ${answer.body.rows.length} are shown.`);
  }
  return 0;
}
