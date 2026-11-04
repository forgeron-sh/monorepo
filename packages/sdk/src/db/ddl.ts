import type { ColumnDef } from "./columns";
import type { Schema } from "./schema";
import { snapshotOf, type ColumnSnapshot, type TableSnapshot } from "./snapshot";
import type { IndexDef } from "./table";

// The SQL of a schema: what `createTestTool` runs on its in-memory database, and the base of the
// migration generator. Each statement is on one line, as D1's `exec` needs.

const q = (name: string) => `"${name}"`;
const literal = (value: string | number | boolean) =>
  typeof value === "string" ? `'${value.replaceAll("'", "''")}'` : String(Number(value));

// 12 hex digits of the time in milliseconds, then 20 random ones: unique, and ordered by creation.
const ID =
  "printf('%012x', cast(unixepoch('subsec') * 1000 as integer)) || lower(hex(randomblob(10)))";
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const TODAY = "date('now')";

/** What follows a personal column's definition in its `CREATE TABLE`. */
export const PERSONAL_MARKER = "/* personal */";

function columnSql(name: string, def: ColumnDef): string {
  const parts = [q(name)];
  switch (def.kind) {
    case "id":
      parts.push("TEXT PRIMARY KEY");
      break;
    case "integer":
    case "boolean":
      parts.push("INTEGER");
      break;
    case "real":
      parts.push("REAL");
      break;
    default:
      parts.push("TEXT");
  }
  if (def.notNull) parts.push("NOT NULL");
  if (def.unique) parts.push("UNIQUE");
  if (def.kind === "id") parts.push(`DEFAULT (${ID})`);
  else if (def.default?.kind === "value") parts.push(`DEFAULT ${literal(def.default.value)}`);
  else if (def.default?.kind === "now")
    parts.push(`DEFAULT (${def.kind === "date" ? TODAY : NOW})`);
  if (def.kind === "boolean") parts.push(`CHECK (${q(name)} IN (0, 1))`);
  if (def.kind === "enum")
    parts.push(`CHECK (${q(name)} IN (${(def.values ?? []).map(literal).join(", ")}))`);
  if (def.kind === "json") parts.push(`CHECK (json_valid(${q(name)}))`);
  if (def.kind === "ref") {
    parts.push(`REFERENCES ${q(def.references!)}(${q("id")})`);
    if (def.onDelete) parts.push(`ON DELETE ${def.onDelete.toUpperCase()}`);
  }
  // A block comment, which SQLite keeps in `sqlite_master`: the explorer reads the tag from there.
  if (def.personal) parts.push(PERSONAL_MARKER);
  return parts.join(" ");
}

export const quote = q;

/** `CREATE TABLE`, under another name if asked: a rebuild creates the new table beside the old. */
export function createTableSql(table: TableSnapshot, name = table.name): string {
  const columns = table.columns.map((column) => columnSql(column.name, column));
  return `CREATE TABLE ${q(name)} (${columns.join(", ")})`;
}

/** `ALTER TABLE … ADD COLUMN`: only for a column SQLite lets be added (see the migration generator). */
export const addColumnSql = (table: string, column: ColumnSnapshot) =>
  `ALTER TABLE ${q(table)} ADD COLUMN ${columnSql(column.name, column)}`;

export const dropColumnSql = (table: string, column: string) =>
  `ALTER TABLE ${q(table)} DROP COLUMN ${q(column)}`;

export const indexName = (table: string, index: IndexDef) =>
  `${table}_${index.columns.join("_")}_${index.unique ? "unique" : "index"}`;

export function createIndexSql(table: string, index: IndexDef): string {
  return `CREATE ${index.unique ? "UNIQUE " : ""}INDEX ${q(indexName(table, index))} ON ${q(table)} (${index.columns.map(q).join(", ")})`;
}

export const dropIndexSql = (table: string, index: IndexDef) =>
  `DROP INDEX ${q(indexName(table, index))}`;

export const triggerName = (table: string, column: string) => `${table}_${column}_on_update`;

/** The trigger of `onUpdateNow()`: it fires when an UPDATE leaves the column as it was. */
export function createTriggerSql(table: string, column: string): string {
  // SQLite does not run the trigger again for its own change.
  return `CREATE TRIGGER ${q(triggerName(table, column))} AFTER UPDATE ON ${q(table)} FOR EACH ROW WHEN NEW.${q(column)} IS OLD.${q(column)} BEGIN UPDATE ${q(table)} SET ${q(column)} = ${NOW} WHERE rowid = NEW.rowid; END`;
}

export const dropTriggerSql = (table: string, column: string) =>
  `DROP TRIGGER ${q(triggerName(table, column))}`;

/** What a table needs besides its `CREATE TABLE`: its indexes, then its triggers. */
export function tableExtrasSql(table: TableSnapshot): string[] {
  return [
    ...table.indexes.map((index) => createIndexSql(table.name, index)),
    ...table.columns.filter((c) => c.onUpdateNow).map((c) => createTriggerSql(table.name, c.name)),
  ];
}

/** `CREATE TABLE`, `CREATE INDEX` and the triggers of `onUpdateNow()`, for every table, in order. */
export function createSchemaSql(schema: Schema): string[] {
  return snapshotOf(schema).tables.flatMap((table) => [
    createTableSql(table),
    ...tableExtrasSql(table),
  ]);
}
