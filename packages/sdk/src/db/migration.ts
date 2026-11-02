import {
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";

// A migration (docs/sdk.md §8): `db/migrations/NNNN_<name>.ts`, `export default migration({ up, down })`.
// It is a list of SQL statements, so that a migration and its record in `_forgeron_migrations` can
// be sent to D1 as one atomic batch (D-012): there is no transaction to wrap code in.

/** A statement: SQL, or SQL with its parameters. */
export type MigrationStatement = string | { sql: string; parameters?: readonly unknown[] };

/** What `up` and `down` give: statements, or a function that writes them with a Kysely. */
export type MigrationSteps =
  | readonly MigrationStatement[]
  | ((
      db: Kysely<any>,
    ) => readonly (
      | MigrationStatement
      | { compile(): { sql: string; parameters: readonly unknown[] } }
    )[]);

export interface MigrationOptions {
  up: MigrationSteps;
  /** Undoes `up`. Data that `up` dropped does not come back. */
  down: MigrationSteps;
  /** Drops or rewrites data: refused in pilot and production without `--allow-destructive`. */
  destructive?: boolean;
}

export interface MigrationDefinition extends MigrationOptions {
  readonly kind: "migration";
}

export const migration = (options: MigrationOptions): MigrationDefinition => ({
  kind: "migration",
  ...options,
});

export interface ResolvedStatement {
  sql: string;
  parameters: unknown[];
}

// A Kysely that compiles and never runs: it lets a migration write `db.schema.…` and `db.insertInto(…)`.
const compiler = new Kysely<any>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

function resolve(steps: MigrationSteps): ResolvedStatement[] {
  const list = typeof steps === "function" ? steps(compiler) : steps;
  return list.map((step) => {
    if (typeof step === "string") return { sql: step, parameters: [] };
    if ("compile" in step) {
      const { sql, parameters } = step.compile();
      return { sql, parameters: [...parameters] };
    }
    return { sql: step.sql, parameters: [...(step.parameters ?? [])] };
  });
}

/** The statements of a migration, ready to be sent. */
export function resolveMigration(definition: MigrationDefinition): {
  up: ResolvedStatement[];
  down: ResolvedStatement[];
} {
  return { up: resolve(definition.up), down: resolve(definition.down) };
}
