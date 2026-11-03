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
import { UsageError, type Io } from "../io";

const USAGE = `Usage: forgeron db <generate|migrate|status|rollback|seed|shell>
  generate [--name <name>]
  migrate  [--env local]
  status   [--env local]
  rollback [--env local] [--steps 1]
  seed
  shell    [--env local] --sql <statement> [--write] [--as <role>]`;

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

function environmentOf(env: string | undefined): void {
  if (env === undefined || env === "local") return;
  if (!["preview", "pilot", "production"].includes(env))
    throw new UsageError(`--env ${env}: unknown environment (local, preview, pilot, production).`);
  throw new UsageError(
    `--env ${env}: a remote environment needs the platform, which is not available yet. Only local is.`,
  );
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
    },
  });
  if (positionals.length > 0) throw new UsageError(USAGE);

  if (sub === "generate") return generate(values.name, io);

  const env = values.env ?? "local";
  if (sub === "shell") {
    if (values.sql === undefined)
      throw new UsageError("forgeron db shell: pass --sql <statement>.");
    checkShell(env, values.sql, { write: values.write === true, role: values.as });
  }
  environmentOf(values.env);

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
