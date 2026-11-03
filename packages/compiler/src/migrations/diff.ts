import {
  addColumnSql,
  createIndexSql,
  createTableSql,
  createTriggerSql,
  dropColumnSql,
  dropIndexSql,
  dropTriggerSql,
  indexName,
  quote,
  tableExtrasSql,
  type ColumnSnapshot,
  type Snapshot,
  type TableSnapshot,
} from "@forgeron/sdk/db";

// Compares two schemas and writes the SQL that goes from one to the other (docs/sdk.md §8).
// SQLite can do a few things with `ALTER TABLE`; for the rest the table is rebuilt: a new one is
// created, filled from the old, the old dropped, the new renamed.

export interface Diff {
  statements: string[];
  /** Drops or rewrites data: a production deployment refuses it without `--allow-destructive`. */
  destructive: boolean;
}

/** The change cannot be written safely by the generator: write the migration by hand. */
export class MigrationGenerationError extends Error {
  override name = "MigrationGenerationError";
}

const sameColumn = (a: ColumnSnapshot, b: ColumnSnapshot) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([x], [y]) => (x < y ? -1 : 1))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}

// What `ALTER TABLE ADD COLUMN` accepts: no primary key or unique, a NOT NULL only with a constant
// default, no default that is a function of the time, a reference only when it may stay NULL.
function canAddColumn(column: ColumnSnapshot): boolean {
  if (column.kind === "id" || column.unique) return false;
  if (column.notNull && column.default === undefined) return false;
  if (column.default?.kind === "now") return false;
  if (column.references !== undefined && column.default !== undefined) return false;
  return true;
}

const dependsOn = (tables: TableSnapshot[], name: string) =>
  tables.some((t) => t.name !== name && t.columns.some((c) => c.references === name));

function alterTable(prev: TableSnapshot, next: TableSnapshot, referencedBy: boolean): Diff {
  const prevCols = new Map(prev.columns.map((c) => [c.name, c]));
  const nextCols = new Map(next.columns.map((c) => [c.name, c]));
  const added = next.columns.filter((c) => !prevCols.has(c.name));
  const removed = prev.columns.filter((c) => !nextCols.has(c.name));
  const changed = next.columns.filter(
    (c) => prevCols.has(c.name) && !sameColumn(prevCols.get(c.name)!, c),
  );

  const prevIndexes = new Map(prev.indexes.map((i) => [indexName(prev.name, i), i]));
  const nextIndexes = new Map(next.indexes.map((i) => [indexName(next.name, i), i]));
  const goneIndexes = [...prevIndexes].filter(([name]) => !nextIndexes.has(name)).map(([, i]) => i);
  const newIndexes = [...nextIndexes].filter(([name]) => !prevIndexes.has(name)).map(([, i]) => i);

  const keptIndexColumns = new Set(
    [...prevIndexes].filter(([name]) => nextIndexes.has(name)).flatMap(([, i]) => i.columns),
  );
  const canDrop = (c: ColumnSnapshot) =>
    c.kind !== "id" && !c.unique && c.references === undefined && !keptIndexColumns.has(c.name);

  const rebuild =
    changed.length > 0 || added.some((c) => !canAddColumn(c)) || removed.some((c) => !canDrop(c));
  const lossy = removed.length > 0 || changed.some((c) => c.kind !== prevCols.get(c.name)!.kind);

  if (rebuild) {
    if (referencedBy) {
      throw new MigrationGenerationError(
        `The table "${next.name}" has to be rebuilt (SQLite cannot make this change in place), and other tables point at it: dropping it would delete or detach their rows. Write this migration by hand, copying the rows of those tables aside first.`,
      );
    }
    const kept = next.columns
      .filter((c) => prevCols.has(c.name))
      .map((c) => quote(c.name))
      .join(", ");
    const copy = `__rebuild`;
    return {
      destructive: lossy,
      statements: [
        createTableSql(next, `${next.name}${copy}`),
        ...(kept
          ? [
              `INSERT INTO ${quote(next.name + copy)} (${kept}) SELECT ${kept} FROM ${quote(prev.name)}`,
            ]
          : []),
        `DROP TABLE ${quote(prev.name)}`,
        `ALTER TABLE ${quote(next.name + copy)} RENAME TO ${quote(next.name)}`,
        ...tableExtrasSql(next),
      ],
    };
  }

  const statements: string[] = [];
  for (const index of goneIndexes) statements.push(dropIndexSql(prev.name, index));
  for (const column of removed) {
    if (column.onUpdateNow) statements.push(dropTriggerSql(prev.name, column.name));
    statements.push(dropColumnSql(prev.name, column.name));
  }
  for (const column of added) {
    statements.push(addColumnSql(next.name, column));
    if (column.onUpdateNow) statements.push(createTriggerSql(next.name, column.name));
  }
  for (const index of newIndexes) statements.push(createIndexSql(next.name, index));
  return { statements, destructive: lossy };
}

/** The SQL that turns the schema of `prev` into that of `next`. */
export function diffSnapshots(prev: Snapshot, next: Snapshot): Diff {
  const statements: string[] = [];
  let destructive = false;
  const prevBy = new Map(prev.tables.map((t) => [t.name, t]));
  const nextBy = new Map(next.tables.map((t) => [t.name, t]));

  for (const table of next.tables) {
    if (!prevBy.has(table.name)) statements.push(createTableSql(table), ...tableExtrasSql(table));
  }

  for (const table of next.tables) {
    const before = prevBy.get(table.name);
    if (!before) continue;
    const diff = alterTable(
      before,
      table,
      dependsOn(prev.tables, table.name) || dependsOn(next.tables, table.name),
    );
    statements.push(...diff.statements);
    destructive ||= diff.destructive;
  }

  // Tables that are gone: first the ones that point at another gone table, so that no row is
  // left pointing at a table that no longer exists.
  const dropped = prev.tables.filter((t) => !nextBy.has(t.name));
  while (dropped.length > 0) {
    const index = dropped.findIndex(
      (t) =>
        !dropped.some((other) => other !== t && other.columns.some((c) => c.references === t.name)),
    );
    const [table] = dropped.splice(index === -1 ? 0 : index, 1);
    statements.push(`DROP TABLE ${quote(table!.name)}`);
    destructive = true;
  }

  return { statements, destructive };
}
