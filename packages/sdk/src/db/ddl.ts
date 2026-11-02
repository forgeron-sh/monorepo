import type { ColumnDef } from "./columns";
import type { Schema } from "./schema";

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
  return parts.join(" ");
}

/** `CREATE TABLE`, `CREATE INDEX` and the triggers of `onUpdateNow()`, for every table, in order. */
export function createSchemaSql(schema: Schema): string[] {
  const statements: string[] = [];
  for (const table of Object.values(schema.tables)) {
    const columns = Object.entries(table.columns).map(([name, column]) =>
      columnSql(name, column.def),
    );
    statements.push(`CREATE TABLE ${q(table.name)} (${columns.join(", ")})`);

    for (const declared of table.indexes) {
      const name = `${table.name}_${declared.columns.join("_")}_${declared.unique ? "unique" : "index"}`;
      statements.push(
        `CREATE ${declared.unique ? "UNIQUE " : ""}INDEX ${q(name)} ON ${q(table.name)} (${declared.columns.map(q).join(", ")})`,
      );
    }

    for (const [name, column] of Object.entries(table.columns)) {
      if (!column.def.onUpdateNow) continue;
      // Fires when an UPDATE leaves the column as it was: SQLite does not run it again for its own change.
      statements.push(
        `CREATE TRIGGER ${q(`${table.name}_${name}_on_update`)} AFTER UPDATE ON ${q(table.name)} FOR EACH ROW WHEN NEW.${q(name)} IS OLD.${q(name)} BEGIN UPDATE ${q(table.name)} SET ${q(name)} = ${NOW} WHERE rowid = NEW.rowid; END`,
      );
    }
  }
  return statements;
}
