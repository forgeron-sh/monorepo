// Applies a build's migrations to a D1 database (docs/sdk.md §8). Neutral: it talks to the small
// surface of a D1 binding, so the gateway, the CLI and a test can all run it.
//
// D1 has no interactive transaction (D-012): a migration and its record in `_forgeron_migrations`
// go in ONE batch, so that it is applied and recorded, or neither.

export interface MigrationStatement {
  sql: string;
  parameters: readonly unknown[];
}

/** A migration as `forgeron build` records it. */
export interface BuildMigration {
  /** `0001_init`: the order is the order of the names. */
  name: string;
  /** Of the file: an applied migration whose file changes is refused. */
  fingerprint: string;
  up: readonly MigrationStatement[];
  down: readonly MigrationStatement[];
  /** Drops or rewrites data: refused in pilot and production without `--allow-destructive`. */
  destructive: boolean;
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all(): Promise<{ results?: unknown[] }>;
}

export interface D1Database {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}

export type MigrationErrorCode =
  | "EDITED"
  | "MISSING"
  | "OUT_OF_ORDER"
  | "DESTRUCTIVE"
  | "NOT_REVERSIBLE"
  | "FAILED";

export class MigrationError extends Error {
  override name = "MigrationError";
  readonly code: MigrationErrorCode;
  /** The migration at fault. */
  readonly migration: string;

  constructor(
    code: MigrationErrorCode,
    migration: string,
    message: string,
    options?: { cause: unknown },
  ) {
    super(message, options);
    this.code = code;
    this.migration = migration;
  }
}

export interface MigrateOptions {
  /** Pilot and production refuse a destructive migration unless told. A local database does not mind. */
  allowDestructive?: boolean;
  now?: () => Date;
}

export interface MigrateResult {
  /** What this call applied, in order. */
  applied: string[];
}

const TRACKING = `CREATE TABLE IF NOT EXISTS "_forgeron_migrations" ("name" TEXT PRIMARY KEY NOT NULL, "fingerprint" TEXT NOT NULL, "applied_at" TEXT NOT NULL)`;

interface Recorded {
  name: string;
  fingerprint: string;
}

async function recorded(d1: D1Database): Promise<Recorded[]> {
  await d1.prepare(TRACKING).all();
  const { results = [] } = await d1
    .prepare(`SELECT "name", "fingerprint" FROM "_forgeron_migrations" ORDER BY "name"`)
    .all();
  return results as Recorded[];
}

const send = (d1: D1Database, { sql, parameters }: MigrationStatement) =>
  d1.prepare(sql).bind(...parameters);

const byName = (migrations: readonly BuildMigration[]) =>
  [...migrations].sort((a, b) => (a.name < b.name ? -1 : 1));

/** What is applied and what is not yet, for this build. */
export async function migrationStatus(d1: D1Database, migrations: readonly BuildMigration[]) {
  const done = new Set((await recorded(d1)).map((r) => r.name));
  const all = byName(migrations);
  return {
    applied: all.filter((m) => done.has(m.name)).map((m) => m.name),
    pending: all.filter((m) => !done.has(m.name)).map((m) => m.name),
  };
}

/** Applies the migrations that are pending, in order, each atomically. Stops at the first failure. */
export async function applyMigrations(
  d1: D1Database,
  migrations: readonly BuildMigration[],
  options: MigrateOptions = {},
): Promise<MigrateResult> {
  const all = byName(migrations);
  const applied = await recorded(d1);
  const known = new Map(all.map((m) => [m.name, m]));

  for (const row of applied) {
    const file = known.get(row.name);
    if (!file) {
      throw new MigrationError(
        "MISSING",
        row.name,
        `The migration ${row.name} was applied, but this build does not have it.`,
      );
    }
    if (file.fingerprint !== row.fingerprint) {
      throw new MigrationError(
        "EDITED",
        row.name,
        `The migration ${row.name} was applied and its file has changed since: add a new migration instead of editing it.`,
      );
    }
  }

  const done = new Set(applied.map((r) => r.name));
  const pending = all.filter((m) => !done.has(m.name));
  const last = applied.at(-1)?.name;
  const late = pending.find((m) => last !== undefined && m.name < last);
  if (late) {
    throw new MigrationError(
      "OUT_OF_ORDER",
      late.name,
      `The migration ${late.name} comes before ${last}, which is already applied.`,
    );
  }
  // Before anything is applied: a refusal leaves the database as it was.
  const destructive = pending.find((m) => m.destructive);
  if (destructive && !options.allowDestructive) {
    throw new MigrationError(
      "DESTRUCTIVE",
      destructive.name,
      `The migration ${destructive.name} drops or rewrites data: deploy it with --allow-destructive.`,
    );
  }

  const result: MigrateResult = { applied: [] };
  for (const migration of pending) {
    const at = (options.now?.() ?? new Date()).toISOString();
    try {
      await d1.batch([
        ...migration.up.map((statement) => send(d1, statement)),
        d1
          .prepare(
            `INSERT INTO "_forgeron_migrations" ("name", "fingerprint", "applied_at") VALUES (?, ?, ?)`,
          )
          .bind(migration.name, migration.fingerprint, at),
      ]);
    } catch (cause) {
      throw new MigrationError(
        "FAILED",
        migration.name,
        `The migration ${migration.name} failed and was rolled back: ${String(cause)}`,
        { cause },
      );
    }
    result.applied.push(migration.name);
  }
  return result;
}

/** Undoes the last `steps` applied migrations, newest first, each atomically. Returns their names. */
export async function revertMigrations(
  d1: D1Database,
  migrations: readonly BuildMigration[],
  options: { steps?: number } = {},
): Promise<string[]> {
  const known = new Map(migrations.map((m) => [m.name, m]));
  const toUndo = (await recorded(d1))
    .slice()
    .reverse()
    .slice(0, options.steps ?? 1);
  const reverted: string[] = [];
  for (const row of toUndo) {
    const file = known.get(row.name);
    if (!file) {
      throw new MigrationError(
        "MISSING",
        row.name,
        `The migration ${row.name} was applied, but this build does not have it.`,
      );
    }
    if (file.down.length === 0) {
      throw new MigrationError(
        "NOT_REVERSIBLE",
        row.name,
        `The migration ${row.name} has no way back.`,
      );
    }
    try {
      await d1.batch([
        ...file.down.map((statement) => send(d1, statement)),
        d1.prepare(`DELETE FROM "_forgeron_migrations" WHERE "name" = ?`).bind(row.name),
      ]);
    } catch (cause) {
      throw new MigrationError(
        "FAILED",
        row.name,
        `Undoing ${row.name} failed and was rolled back: ${String(cause)}`,
        { cause },
      );
    }
    reverted.push(row.name);
  }
  return reverted;
}
