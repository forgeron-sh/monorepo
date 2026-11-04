// The statements of the database explorer. The server builds every one of them itself, from
// parameters it has validated against the table's own metadata: an identifier is only ever one the
// database reported (and is quoted), a value is only ever bound. There is no way to hand it SQL, and
// `assertSelect` refuses anything that is not one `SELECT`, whatever built it (docs/DECISIONS.md, D-057).

export const PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
/** Past this offset a person is shown how to narrow the filter, not a deeper page. */
export const MAX_OFFSET = 10_000;
export const MAX_FILTERS = 10;
export const MAX_EXPORT_ROWS = 10_000;
/** The tables of the platform that a tool did not declare, hidden unless asked for. */
export const PLATFORM_TABLES = ["_forgeron_migrations"];

export type ColumnKind = "integer" | "real" | "text" | "blob";

export interface ColumnInfo {
  name: string;
  /** The type as declared (`TEXT`, `INTEGER`, …). */
  type: string;
  kind: ColumnKind;
  notNull: boolean;
  primaryKey: boolean;
  unique: boolean;
  default: string | null;
  /** Why the column is masked, if it is. */
  masked: MaskReason | null;
}

export type MaskReason = "tagged" | "name";

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

/** SQLite affinity rules, reduced to what a filter needs to know. */
export function kindOf(declared: string): ColumnKind {
  const type = declared.toUpperCase();
  if (type.includes("INT")) return "integer";
  if (type.includes("CHAR") || type.includes("CLOB") || type.includes("TEXT") || type === "") {
    return "text";
  }
  if (type.includes("BLOB")) return "blob";
  return "real";
}

// ---- personal data

/** Names that say a column holds personal data when the tool did not tag it. */
const PERSONAL_NAME =
  /(^|_)(e_?mail|phone|mobile|first_?name|last_?name|full_?name|surname|address|street|birth\w*|dob|ssn|iban|ip|ip_address|passport|password|token|secret)(_|$)/i;

export const isPersonalName = (column: string) => PERSONAL_NAME.test(column);

/**
 * The columns of a `CREATE TABLE` that carry the `/* personal *\/` tag `t.text().personal()` writes
 * (`PERSONAL_MARKER` of `@forgeron/sdk/db`). The statement is split on top-level commas, quotes and
 * comments respected; the first identifier of each part is the column.
 */
export function taggedColumns(createSql: string | null | undefined): Set<string> {
  const tagged = new Set<string>();
  if (!createSql) return tagged;
  const open = createSql.indexOf("(");
  if (open < 0) return tagged;
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = open + 1; i < createSql.length; i++) {
    const c = createSql[i]!;
    if (c === "'" || c === '"' || c === "`") {
      const end = closing(createSql, i, c);
      current += createSql.slice(i, end + 1);
      i = end;
    } else if (c === "/" && createSql[i + 1] === "*") {
      const end = createSql.indexOf("*/", i + 2);
      const stop = end < 0 ? createSql.length : end + 2;
      current += createSql.slice(i, stop);
      i = stop - 1;
    } else if (c === "(") {
      depth++;
      current += c;
    } else if (c === ")") {
      if (depth === 0) break;
      depth--;
      current += c;
    } else if (c === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += c;
  }
  parts.push(current);
  for (const part of parts) {
    if (!/\/\*\s*personal\s*\*\//i.test(part.replace(/'(?:[^']|'')*'/g, "''"))) continue;
    const name = /^\s*(?:"((?:[^"]|"")+)"|`([^`]+)`|\[([^\]]+)\]|([A-Za-z_]\w*))/.exec(part);
    const found = name?.[1]?.replaceAll('""', '"') ?? name?.[2] ?? name?.[3] ?? name?.[4];
    if (found) tagged.add(found);
  }
  return tagged;
}

function closing(text: string, from: number, quoteChar: string): number {
  for (let i = from + 1; i < text.length; i++) {
    if (text[i] === quoteChar) {
      if (text[i + 1] === quoteChar) i++;
      else return i;
    }
  }
  return text.length - 1;
}

// ---- filters

const OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "startsWith",
  "isNull",
  "notNull",
] as const;
export type Operator = (typeof OPERATORS)[number];

export interface Filter {
  column: string;
  op: Operator;
  value?: string | number | boolean;
}

/** The operators that make sense for a column kind: what the filter bar offers. */
export const operatorsFor = (kind: ColumnKind): Operator[] =>
  kind === "text"
    ? [...OPERATORS]
    : kind === "blob"
      ? ["isNull", "notNull"]
      : ["eq", "neq", "gt", "gte", "lt", "lte", "isNull", "notNull"];

export class QueryRefusal extends Error {
  override name = "QueryRefusal";
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const refuse = (code: string, message: string): never => {
  throw new QueryRefusal(code, message);
};

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

export interface RowQuery {
  filters?: Filter[];
  sort?: string;
  descending?: boolean;
  limit: number;
  offset: number;
  /** Masked columns are selected, filtered and sorted on only when this is set (an admin's choice). */
  reveal?: boolean;
}

function findColumn(table: TableInfo, name: unknown, reveal: boolean): ColumnInfo {
  const column = typeof name === "string" ? table.columns.find((c) => c.name === name) : undefined;
  if (!column) return refuse("UNKNOWN_COLUMN", `The table ${table.name} has no such column.`);
  if (column.masked && !reveal) {
    // Sorting or filtering on a masked column would leak what it hides, one comparison at a time.
    return refuse("MASKED_COLUMN", `The column ${column.name} is masked.`);
  }
  return column;
}

function condition(table: TableInfo, filter: Filter, reveal: boolean, params: unknown[]): string {
  const column = findColumn(table, filter.column, reveal);
  if (!(OPERATORS as readonly string[]).includes(filter.op)) {
    return refuse("UNKNOWN_OPERATOR", `Unknown operator ${String(filter.op)}.`);
  }
  if (!operatorsFor(column.kind).includes(filter.op)) {
    return refuse(
      "BAD_OPERATOR",
      `${filter.op} does not apply to ${column.type || "this"} columns.`,
    );
  }
  const id = quote(column.name);
  if (filter.op === "isNull") return `${id} IS NULL`;
  if (filter.op === "notNull") return `${id} IS NOT NULL`;
  const raw = filter.value;
  if (raw === undefined || raw === null || typeof raw === "object") {
    return refuse("BAD_VALUE", `${filter.op} needs a value.`);
  }
  let value: string | number;
  if (column.kind === "text") {
    value = String(raw);
    if (value.length > 500) return refuse("BAD_VALUE", "A filter value is at most 500 characters.");
  } else {
    const text = typeof raw === "boolean" ? (raw ? "1" : "0") : String(raw).trim();
    value = Number(text);
    if (text === "" || !Number.isFinite(value)) {
      return refuse("BAD_VALUE", `${column.name} is a number: ${String(raw)} is not.`);
    }
  }
  const sqlOp = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" } as const;
  if (filter.op === "contains" || filter.op === "startsWith") {
    const like = escapeLike(String(value));
    params.push(filter.op === "contains" ? `%${like}%` : `${like}%`);
    return `${id} LIKE ? ESCAPE '\\'`;
  }
  params.push(value);
  return `${id} ${sqlOp[filter.op]} ?`;
}

function where(table: TableInfo, query: RowQuery, params: unknown[]): string {
  const filters = query.filters ?? [];
  if (filters.length > MAX_FILTERS) {
    return refuse("TOO_MANY_FILTERS", `At most ${MAX_FILTERS} filters.`);
  }
  const clauses = filters.map((f) => condition(table, f, query.reveal === true, params));
  return clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
}

/** The columns a person sees: all of them, less the masked ones unless revealed. */
export const visibleColumns = (table: TableInfo, reveal = false) =>
  table.columns.filter((c) => reveal || !c.masked);

export interface Statement {
  sql: string;
  params: unknown[];
}

/** `SELECT COUNT(*)` of the rows that match. */
export function countStatement(table: TableInfo, query: Pick<RowQuery, "filters" | "reveal">) {
  const params: unknown[] = [];
  const clause = where(table, { ...query, limit: 0, offset: 0 }, params);
  return assertSelect({ sql: `SELECT COUNT(*) AS n FROM ${quote(table.name)}${clause}`, params });
}

/** One page of rows, sorted, filtered, with one row more than asked to tell whether there is a next page. */
export function rowsStatement(table: TableInfo, query: RowQuery): Statement {
  if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > MAX_EXPORT_ROWS) {
    refuse("BAD_LIMIT", "The page size is a whole number of rows.");
  }
  if (!Number.isInteger(query.offset) || query.offset < 0) {
    refuse("BAD_OFFSET", "The offset is a whole number of rows.");
  }
  if (query.offset > MAX_OFFSET) {
    refuse("OFFSET_TOO_DEEP", `Rows past ${MAX_OFFSET} are not paged: narrow the filter.`);
  }
  const params: unknown[] = [];
  const clause = where(table, query, params);
  const columns = visibleColumns(table, query.reveal);
  if (!columns.length) return refuse("NO_COLUMNS", "Every column of this table is masked.");
  const direction = query.descending ? "DESC" : "ASC";
  const order: string[] = [];
  if (query.sort !== undefined) {
    order.push(`${quote(findColumn(table, query.sort, query.reveal === true).name)} ${direction}`);
  }
  // A total order, so that two pages never overlap: the primary key, else the row id.
  const keys = table.columns.filter((c) => c.primaryKey).map((c) => quote(c.name));
  for (const key of keys.length ? keys : ["rowid"]) order.push(key);
  params.push(query.limit + 1, query.offset);
  return assertSelect({
    sql: `SELECT ${columns.map((c) => quote(c.name)).join(", ")} FROM ${quote(table.name)}${clause} ORDER BY ${order.join(", ")} LIMIT ? OFFSET ?`,
    params,
  });
}

// ---- the last line of defence

const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|create|replace|attach|detach|pragma|vacuum|reindex|analyze|begin|commit|rollback|savepoint|release)\b/i;

/**
 * Whatever built a statement, it is one `SELECT`: nothing outside quotes may be a second statement or a
 * keyword that writes. Quoted identifiers and bound values are not looked at: they cannot be code.
 */
export function assertSelect<T extends Statement>(statement: T): T {
  const bare = statement.sql.replace(/"(?:[^"]|"")*"|'(?:[^']|'')*'/g, "''");
  if (!/^\s*select\b/i.test(bare) || bare.includes(";") || FORBIDDEN.test(bare)) {
    throw new QueryRefusal("NOT_READ_ONLY", "Only a SELECT can be run.");
  }
  return statement;
}
