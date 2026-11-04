// Typed calls to the gateway's database explorer (`/console-api/api/tools/<tool>/db/...`, D-058).
// The browser never holds a Cloudflare token: the gateway reaches the database.
import { CONSOLE_API, type FetchJson } from "../../api";

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

const targetParams = (target: Target, params = new URLSearchParams()) => {
  params.set("env", target.env);
  if (target.branch) params.set("branch", target.branch);
  return params;
};

export async function loadEnvironments(fetchJson: FetchJson, tool: string): Promise<Target[]> {
  const body = (await fetchJson(`${root(tool)}/environments`)) as {
    environments?: Array<{ name: "production" | "preview"; branch?: string }>;
  };
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
  const params = targetParams(target);
  if (platform) params.set("platform", "1");
  return ((await fetchJson(`${root(tool)}/tables?${params}`)) as { tables: TableSummary[] }).tables;
}

export async function loadSchema(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  platform: boolean,
): Promise<DbTable[]> {
  const params = targetParams(target);
  if (platform) params.set("platform", "1");
  return ((await fetchJson(`${root(tool)}/schema?${params}`)) as { tables: DbTable[] }).tables;
}

export async function loadTable(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  table: string,
): Promise<DbTable> {
  const params = targetParams(target);
  params.set("platform", "1");
  return (
    (await fetchJson(`${root(tool)}/tables/${encodeURIComponent(table)}?${params}`)) as {
      table: DbTable;
    }
  ).table;
}

function rowParams(target: Target, query: Partial<RowQuery>) {
  const params = targetParams(target);
  params.set("platform", "1");
  if (query.sort) {
    params.set("sort", query.sort);
    params.set("dir", query.descending ? "desc" : "asc");
  }
  if (query.filters?.length) params.set("filter", JSON.stringify(query.filters));
  return params;
}

export async function loadRows(
  fetchJson: FetchJson,
  tool: string,
  target: Target,
  table: string,
  query: RowQuery,
): Promise<RowsPage> {
  const params = rowParams(target, query);
  params.set("page", String(query.page));
  return (await fetchJson(
    `${root(tool)}/tables/${encodeURIComponent(table)}/rows?${params}`,
  )) as RowsPage;
}

/** Where the CSV of the rows that match is, for a link: the browser sends its own session. */
export function exportPath(tool: string, target: Target, table: string, query: Partial<RowQuery>) {
  return `${CONSOLE_API}${root(tool)}/tables/${encodeURIComponent(table)}/export?${rowParams(target, query)}`;
}

export const targetLabel = (target: Target) =>
  target.env === "production" ? "Production" : `Preview · ${target.branch}`;
export const targetId = (target: Target) =>
  target.env === "production" ? "production" : `preview:${target.branch}`;
