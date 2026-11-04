// Reads a tool's database through a connection that can only run what `assertSelect` accepts. The
// metadata comes from SQLite itself (`sqlite_master`, `pragma_table_info`, `pragma_foreign_key_list`,
// `pragma_index_list`); the rows come from statements built in `sql.ts`.
import type { D1Database } from "@forgeron/hosting";
import {
  PLATFORM_TABLES,
  assertSelect,
  countStatement,
  isPersonalName,
  kindOf,
  quote,
  rowsStatement,
  taggedColumns,
  visibleColumns,
  type ColumnInfo,
  type RowQuery,
  type Statement,
  type TableInfo,
} from "./sql";

interface ForeignKey {
  columns: string[];
  references: { table: string; columns: string[] };
  onUpdate: string;
  onDelete: string;
}

interface IndexInfo {
  name: string;
  unique: boolean;
  /** `c` created by `CREATE INDEX`, `u` by a UNIQUE constraint, `pk` by the primary key. */
  origin: string;
  columns: string[];
}

export interface TableDefinition extends TableInfo {
  indexes: IndexInfo[];
  foreignKeys: ForeignKey[];
}

const MAX_TABLES = 200;

/** A connection that refuses to run anything but a SELECT. */
export function readOnly(db: D1Database) {
  return {
    async all<T = Record<string, unknown>>(statement: Statement): Promise<T[]> {
      assertSelect(statement);
      const result = await db
        .prepare(statement.sql)
        .bind(...statement.params)
        .all();
      return (result.results ?? []) as T[];
    },
  };
}
export type ReadOnlyDb = ReturnType<typeof readOnly>;

const select = (sql: string, params: unknown[] = []): Statement => ({ sql, params });

/**
 * The tables a person may open: the tool's own, and the platform's only when asked for. D1 refuses
 * any read of its own `_cf_*` tables ("not authorized"), `pragma_*` included, and a
 * `pragma_table_info(m.name)` joined to `sqlite_master` runs once per row it did not filter out: the
 * filter is in every statement that reaches a table, not only in the list of names.
 */
const hidden = (column: string) =>
  `${column} NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND ${column} NOT LIKE '\\_cf\\_%' ESCAPE '\\'`;
const TABLES = `SELECT name, sql FROM sqlite_master WHERE type = 'table' AND ${hidden("name")} ORDER BY name LIMIT ${MAX_TABLES}`;

export async function loadSchema(
  db: ReadOnlyDb,
  options: { includePlatform?: boolean } = {},
): Promise<TableDefinition[]> {
  const tables = (await db.all<{ name: string; sql: string | null }>(select(TABLES))).filter(
    (t) => options.includePlatform || !PLATFORM_TABLES.includes(t.name),
  );
  if (!tables.length) return [];
  const [columns, foreign, indexes] = await Promise.all([
    db.all<{
      tbl: string;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>(
      select(
        `SELECT m.name AS tbl, p.name, p.type, p."notnull", p.dflt_value, p.pk FROM sqlite_master m, pragma_table_info(m.name) p WHERE m.type = 'table' AND ${hidden("m.name")} ORDER BY m.name, p.cid`,
      ),
    ),
    db.all<{
      tbl: string;
      id: number;
      seq: number;
      table: string;
      from: string;
      to: string | null;
      on_update: string;
      on_delete: string;
    }>(
      select(
        `SELECT m.name AS tbl, f.id, f.seq, f."table", f."from", f."to", f.on_update, f.on_delete FROM sqlite_master m, pragma_foreign_key_list(m.name) f WHERE m.type = 'table' AND ${hidden("m.name")} ORDER BY m.name, f.id, f.seq`,
      ),
    ),
    db.all<{
      tbl: string;
      name: string;
      unique: number;
      origin: string;
      column: string | null;
      seqno: number;
    }>(
      select(
        `SELECT m.name AS tbl, i.name, i."unique", i.origin, c.name AS "column", c.seqno FROM sqlite_master m, pragma_index_list(m.name) i, pragma_index_info(i.name) c WHERE m.type = 'table' AND ${hidden("m.name")} ORDER BY m.name, i.seq, c.seqno`,
      ),
    ),
  ]);

  return tables.map((table): TableDefinition => {
    const tagged = taggedColumns(table.sql);
    const indexList: IndexInfo[] = [];
    for (const row of indexes.filter((r) => r.tbl === table.name)) {
      const index = indexList.find((i) => i.name === row.name);
      if (index) {
        if (row.column) index.columns.push(row.column);
      } else {
        indexList.push({
          name: row.name,
          unique: row.unique === 1,
          origin: row.origin,
          columns: row.column ? [row.column] : [],
        });
      }
    }
    // A column that alone has a UNIQUE index (a constraint or a unique index) is unique.
    const uniqueColumns = new Set(
      indexList.filter((i) => i.unique && i.columns.length === 1).map((i) => i.columns[0]!),
    );
    const cols: ColumnInfo[] = columns
      .filter((c) => c.tbl === table.name)
      .map((c) => ({
        name: c.name,
        type: c.type,
        kind: kindOf(c.type),
        notNull: c.notnull === 1 || c.pk > 0,
        primaryKey: c.pk > 0,
        unique: uniqueColumns.has(c.name),
        default: c.dflt_value,
        masked: tagged.has(c.name) ? "tagged" : isPersonalName(c.name) ? "name" : null,
      }));
    const foreignKeys: ForeignKey[] = [];
    for (const row of foreign.filter((r) => r.tbl === table.name)) {
      const key = foreignKeys[row.id];
      if (key) {
        key.columns.push(row.from);
        if (row.to) key.references.columns.push(row.to);
      } else {
        foreignKeys[row.id] = {
          columns: [row.from],
          references: { table: row.table, columns: row.to ? [row.to] : [] },
          onUpdate: row.on_update,
          onDelete: row.on_delete,
        };
      }
    }
    return {
      name: table.name,
      columns: cols,
      indexes: indexList,
      foreignKeys: foreignKeys.filter(Boolean),
    };
  });
}

/** The row count of every table, in one statement. */
export async function countRows(db: ReadOnlyDb, tables: TableInfo[]): Promise<Map<string, number>> {
  if (!tables.length) return new Map();
  const sql = tables
    .map((t, i) => `SELECT ${i} AS i, COUNT(*) AS n FROM ${quote(t.name)}`)
    .join(" UNION ALL ");
  const rows = await db.all<{ i: number; n: number }>(select(sql));
  return new Map(rows.map((r) => [tables[r.i]!.name, r.n]));
}

export type Cell = string | number | null;

const cell = (value: unknown): Cell =>
  value === null || value === undefined
    ? null
    : typeof value === "number" || typeof value === "string"
      ? value
      : Array.isArray(value)
        ? `<blob, ${value.length} bytes>`
        : String(value);

export interface RowsPage {
  /** Only the columns that were read: a masked column is not among them. */
  columns: string[];
  rows: Cell[][];
  total: number;
  hasMore: boolean;
}

export async function readRows(
  db: ReadOnlyDb,
  table: TableInfo,
  query: RowQuery,
  options: { withTotal?: boolean } = {},
): Promise<RowsPage> {
  const columns = visibleColumns(table, query.reveal).map((c) => c.name);
  const statement = rowsStatement(table, query);
  const [rows, total] = await Promise.all([
    db.all<Record<string, unknown>>(statement),
    options.withTotal === false
      ? Promise.resolve(undefined)
      : db.all<{ n: number }>(countStatement(table, query)),
  ]);
  return {
    columns,
    rows: rows.slice(0, query.limit).map((row) => columns.map((name) => cell(row[name]))),
    total: total?.[0]?.n ?? -1,
    hasMore: rows.length > query.limit,
  };
}
