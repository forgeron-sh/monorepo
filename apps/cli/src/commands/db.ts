import { generateMigration, MigrationGenerationError } from "@forgeron/compiler";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";

const NOT_YET = ["migrate", "status", "rollback", "seed", "shell"];

/** `forgeron db generate [--name <name>]`: writes the migration for the change of `db/schema.ts`. */
export async function db(args: string[], io: Io): Promise<number> {
  const [sub, ...rest] = args;
  if (sub === undefined) throw new UsageError("Usage: forgeron db generate [--name <name>]");
  if (NOT_YET.includes(sub)) {
    throw new UsageError(
      `forgeron db ${sub} is not available yet: \`forgeron dev\` applies the migrations to the local database.`,
    );
  }
  if (sub !== "generate")
    throw new UsageError(
      `forgeron db: unknown subcommand "${sub}". Usage: forgeron db generate [--name <name>]`,
    );

  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: { name: { type: "string" } },
  });
  if (positionals.length > 0) throw new UsageError("Usage: forgeron db generate [--name <name>]");

  try {
    const result = await generateMigration(
      io.cwd,
      values.name === undefined ? {} : { name: values.name },
    );
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
