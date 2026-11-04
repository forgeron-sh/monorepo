// Typed calls to the gateway's database explorer (`/console-api/api/tools/<tool>/db/...`, D-059).
// The browser never holds a Cloudflare token: the gateway reaches the database.
import { addresses } from "@forgeron/platform-contract/client";
import { CONSOLE_API, ok, typedClient, type FetchJson } from "../../api";

export type Operator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "isNull"
  | "notNull";

export interface Target {
  env: "production" | "preview";
  branch?: string;
}

export interface DbColumn {
  name: string;
  type: string;
  kind: "integer" | "real" | "text" | "blob";
  notNull: boolean;
  primaryKey: boolean;
  unique: boolean;
  default: string | null;
  masked: "tagged" | "name" | null;
  operators: Operator[];
  foreignKey: { table: string; columns: string[] } | null;
}

interface ForeignKey {
  columns: string[];
  references: { table: string; columns: string[] };
  onUpdate: string;
  onDelete: string;
}

interface DbIndex {
  name: string;
  unique: boolean;
  origin: string;
  columns: string[];
}

export interface DbTable {
  name: string;
  rows: number;
  columns: DbColumn[];
  indexes: DbIndex[];
  foreignKeys: ForeignKey[];
}

export interface TableSummary {
  name: string;
  rows: number;
  columns: number;
}

export type RowCell = string | number | null | { masked: "tagged" | "name" };

export interface RowsPage {
  columns: DbColumn[];
  rows: RowCell[][];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  offsetCap: number;
}

export interface Filter {
  column: string;
  op: Operator;
  value?: string;
}

export interface RowQuery {
  page: number;
  sort?: string;
  descending?: boolean;
  filters: Filter[];
}

const root = (tool: string) => `/api/tools/${encodeURIComponent(tool)}/db`;

/** The query of a call, in the order the address has always had: `env`, `branch`, then the rest. */
type Query = Record<string, string>;
const targetQuery = (target: Target): Query => ({
  env: target.env,
  ...(target.branch ? { branch: target.branch } : {}),
});

export async function loadEnvironments(fetchJson: FetchJson, tool: string): Promise<Target[]> {
  const body = ok(await typedClient(fetchJson)(addresses.dbEnvironments, { params: { tool } }));
  return (body.environments ?? []).map((e) => ({
    env: e.name,
    ...(e.branch ? { branch: e.branch } : {}),
  }));
}

export async function loadTables(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  platform: boolean,
): Promise<TableSummary[]> {
  const query = { ...targetQuery(target), ...(platform ? { platform: "1" } : {}) };
  return ok(await typedClient(fetchJson)(addresses.dbTables, { params: { tool }, query }))
    .tables as TableSummary[];
}

export async function loadSchema(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  platform: boolean,
): Promise<DbTable[]> {
  const query = { ...targetQuery(target), ...(platform ? { platform: "1" } : {}) };
  return ok(await typedClient(fetchJson)(addresses.dbSchema, { params: { tool }, query }))
    .tables as unknown as DbTable[];
}

export async function loadTable(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  table: string,
): Promise<DbTable> {
  const query = { ...targetQuery(target), platform: "1" };
  return ok(await typedClient(fetchJson)(addresses.dbTable, { params: { tool, table }, query }))
    .table as unknown as DbTable;
}

function rowQuery(target: Target, query: Partial<RowQuery>): Query {
  return {
    ...targetQuery(target),
    platform: "1",
    ...(query.sort ? { sort: query.sort, dir: query.descending ? "desc" : "asc" } : {}),
    ...(query.filters?.length ? { filter: JSON.stringify(query.filters) } : {}),
  };
}

export async function loadRows(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  table: string,
  query: RowQuery,
): Promise<RowsPage> {
  const answer = ok(
    await typedClient(fetchJson)(addresses.dbRows, {
      params: { tool, table },
      query: { ...rowQuery(target, query), page: String(query.page) },
    }),
  );
  return answer as unknown as RowsPage;
}

/** Where the CSV of the rows that match is, for a link: the browser sends its own session. */
export function exportPath(tool: string, target: Target, table: string, query: Partial<RowQuery>) {
  return `${CONSOLE_API}${root(tool)}/tables/${encodeURIComponent(table)}/export?${new URLSearchParams(rowQuery(target, query))}`;
}

export const targetLabel = (target: Target) =>
  target.env === "production" ? "Production" : `Preview · ${target.branch}`;
export const targetId = (target: Target) =>
  target.env === "production" ? "production" : `preview:${target.branch}`;
