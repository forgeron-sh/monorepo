// The database explorer of the console, read only (docs/console-ux.md, D-056):
//   GET /api/tools/<tool>/db/environments            -> { environments: [{ name, branch?, version? }] }
//   GET /api/tools/<tool>/db/tables                  -> { tables: [{ name, rows, columns }], hidden }
//   GET /api/tools/<tool>/db/schema                  -> { tables: [definition with rows] } (tables and relations)
//   GET /api/tools/<tool>/db/tables/<table>          -> { table: definition, rows } (the Definition view)
//   GET /api/tools/<tool>/db/tables/<table>/rows     -> { columns, rows, total, page, pageSize, hasMore }
//   GET /api/tools/<tool>/db/tables/<table>/export   -> the rows as CSV, at most MAX_EXPORT_ROWS
// The environment is `?env=production` or `?env=preview&branch=<name>` and must be one the registry knows.
// Rows take `page`, `limit` (at most 100), `sort`, `dir=asc|desc` and `filter`, a JSON list of
// `{ column, op, value }`. `platform=1` shows the platform's own tables, `reveal=1` (admins) the masked columns.
// The browser never holds a Cloudflare token: the gateway reaches the database through the hosting layer.
// Every access is written to the audit log (kind `access`, subject `db:<what>[:<table>]`) before data is sent.
import type { Hosting } from "@forgeron/hosting";
import type { Registry } from "@forgeron/registry";
import {
  countRows,
  loadSchema,
  readOnly,
  readRows,
  type Cell,
  type TableDefinition,
} from "./explorer";
import {
  MAX_EXPORT_ROWS,
  MAX_FILTERS,
  MAX_OFFSET,
  MAX_PAGE_SIZE,
  PAGE_SIZE,
  QueryRefusal,
  operatorsFor,
  type Filter,
  type MaskReason,
  type Operator,
} from "./sql";

const ROUTE =
  /^\/api\/tools\/([a-z0-9-]+)\/db\/(environments|tables|schema)(?:\/([^/]+)(?:\/(rows|export))?)?$/;
/** A statement that takes longer is given up on: the person gets an answer, the database keeps working. */
export const STATEMENT_TIMEOUT_MS = 10_000;
const EXPORT_CHUNK = 1000;

export interface DatabaseApiOptions {
  registry: Registry;
  workspace: string;
  hosting(workspace: string): Hosting | undefined;
  /** The caller, resolved by identity: `undefined` is anonymous. */
  caller(
    request: Request,
  ): Promise<{ admin: boolean; developer?: boolean; id?: string } | undefined>;
  timeoutMs?: number;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const failure = (status: number, error: string, message: string) =>
  json(status, { error, message });

class Timeout extends Error {}

function within<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clock = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Timeout()), ms);
  });
  return Promise.race([work, clock]).finally(() => clearTimeout(timer));
}

function parseFilters(raw: string | null): Filter[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new QueryRefusal("BAD_FILTER", "`filter` is a JSON list of { column, op, value }.");
  }
  if (!Array.isArray(parsed) || parsed.length > MAX_FILTERS) {
    throw new QueryRefusal("BAD_FILTER", `\`filter\` is a list of at most ${MAX_FILTERS} filters.`);
  }
  return parsed.map((f: unknown) => {
    const { column, op, value } = (f ?? {}) as Record<string, unknown>;
    if (typeof column !== "string" || typeof op !== "string") {
      throw new QueryRefusal("BAD_FILTER", "A filter is { column, op, value }.");
    }
    if (value !== undefined && !["string", "number", "boolean"].includes(typeof value)) {
      throw new QueryRefusal("BAD_VALUE", "A filter value is a string, a number or a boolean.");
    }
    return {
      column,
      op: op as Operator,
      ...(value === undefined ? {} : { value: value as string }),
    };
  });
}

const integer = (raw: string | null, fallback: number, name: string) => {
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new QueryRefusal("BAD_PAGE", `\`${name}\` is a whole number, 1 or more.`);
  }
  return n;
};

const csvField = (cell: Cell | { masked: MaskReason }) => {
  if (cell === null) return "";
  let text = typeof cell === "object" ? "" : String(cell);
  // A spreadsheet runs a cell that starts like a formula: keep it as text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const describe = (table: TableDefinition, rows?: number) => ({
  ...table,
  ...(rows === undefined ? {} : { rows }),
  columns: table.columns.map((column) => ({
    ...column,
    operators: operatorsFor(column.kind),
    foreignKey:
      table.foreignKeys.find((key) => key.columns.includes(column.name))?.references ?? null,
  })),
});

/** Answers a database explorer route, or `undefined` when the request is for another route. */
export async function handleDatabase(
  request: Request,
  options: DatabaseApiOptions,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const match = ROUTE.exec(url.pathname);
  // Only `tables` has anything below it.
  if (!match || (match[2] !== "tables" && match[3])) return undefined;
  if (request.method !== "GET")
    return failure(405, "METHOD_NOT_ALLOWED", "The database is read only.");

  const caller = await options.caller(request);
  if (!caller) return failure(401, "UNAUTHENTICATED", "Sign in first.");
  const tool = await options.registry.findTool(options.workspace, match[1]!);
  if (!tool) return failure(404, "NOT_FOUND", `There is no tool ${match[1]}.`);
  const audit = (subject: string, result: "ok" | "denied" | "error", detail?: unknown) =>
    options.registry.recordAudit({
      toolId: tool.id,
      actor: caller.id ?? "unknown",
      interface: "web",
      kind: "access",
      subject,
      result,
      ...(detail === undefined ? {} : { detail }),
    });
  const [, , what, table, view] = match;
  if (!(caller.admin || caller.developer) || !caller.id) {
    await audit(`db:${what}${table ? `:${decodeURIComponent(table)}` : ""}`, "denied");
    return failure(403, "FORBIDDEN", "The database is for admins and developers.");
  }

  const environments = await options.registry.listEnvironments(tool.id);
  if (what === "environments") {
    return json(200, {
      environments: environments
        .filter((e) => e.versionId)
        .map((e) => ({ name: e.name, ...(e.branch ? { branch: e.branch } : {}) })),
    });
  }

  const name = url.searchParams.get("env") ?? "production";
  const branch = url.searchParams.get("branch") ?? undefined;
  // Only an environment the registry knows: the client never names a database.
  const environment = environments.find(
    (e) => e.name === name && (e.name === "production" ? !branch : e.branch === branch),
  );
  if (!environment) return failure(404, "NOT_FOUND", "There is no such environment.");
  const hosting = options.hosting(options.workspace);
  if (!hosting?.openDatabase) {
    return failure(501, "NOT_AVAILABLE", "This install cannot read tool databases.");
  }
  const target = {
    name: environment.name,
    ...(environment.branch ? { branch: environment.branch } : {}),
  };
  const where = {
    environment: environment.name,
    ...(environment.branch ? { branch: environment.branch } : {}),
  };
  const timeoutMs = options.timeoutMs ?? STATEMENT_TIMEOUT_MS;

  try {
    const raw = await within(hosting.openDatabase({ tool: tool.name, ...target }), timeoutMs);
    if (!raw) return failure(404, "NO_DATABASE", "This tool has no database in this environment.");
    const db = readOnly(raw);
    const platform = url.searchParams.get("platform") === "1";
    const reveal = url.searchParams.get("reveal") === "1";
    if (reveal && !caller.admin) {
      return failure(403, "FORBIDDEN", "Only an admin can show masked columns.");
    }
    const schema = await within(loadSchema(db, { includePlatform: platform }), timeoutMs);

    if (what === "tables" && !table) {
      const counts = await within(countRows(db, schema), timeoutMs);
      await audit("db:list", "ok", where);
      return json(200, {
        tables: schema.map((t) => ({
          name: t.name,
          rows: counts.get(t.name) ?? 0,
          columns: t.columns.length,
        })),
      });
    }
    if (what === "schema") {
      const counts = await within(countRows(db, schema), timeoutMs);
      await audit("db:schema", "ok", where);
      return json(200, { tables: schema.map((t) => describe(t, counts.get(t.name) ?? 0)) });
    }

    const selected = schema.find((t) => t.name === decodeURIComponent(table!));
    if (!selected) return failure(404, "NOT_FOUND", "There is no such table.");

    if (!view) {
      const counts = await within(countRows(db, [selected]), timeoutMs);
      await audit(`db:table:${selected.name}`, "ok", where);
      return json(200, { table: describe(selected, counts.get(selected.name) ?? 0) });
    }

    const filters = parseFilters(url.searchParams.get("filter"));
    const sort = url.searchParams.get("sort") ?? undefined;
    const descending = url.searchParams.get("dir") === "desc";
    const base = { filters, ...(sort ? { sort } : {}), descending, reveal };
    const filtered = {
      filters: filters.map((f) => ({ column: f.column, op: f.op })),
      ...(sort ? { sort, dir: descending ? "desc" : "asc" } : {}),
    };

    const expand = (columns: string[], rows: Cell[][]) =>
      rows.map((row) =>
        selected.columns.map((column) => {
          const at = columns.indexOf(column.name);
          return at >= 0 ? row[at]! : ({ masked: column.masked! } as const);
        }),
      );

    if (view === "rows") {
      const size = Math.min(
        integer(url.searchParams.get("limit"), PAGE_SIZE, "limit"),
        MAX_PAGE_SIZE,
      );
      const page = integer(url.searchParams.get("page"), 1, "page");
      const offset = (page - 1) * size;
      if (offset > MAX_OFFSET) {
        throw new QueryRefusal(
          "OFFSET_TOO_DEEP",
          `Rows past ${MAX_OFFSET} are not paged: narrow the filter.`,
        );
      }
      const result = await within(
        readRows(db, selected, { ...base, limit: size, offset }),
        timeoutMs,
      );
      await audit(`db:rows:${selected.name}`, "ok", {
        ...where,
        page,
        ...filtered,
        ...(reveal ? { revealed: true } : {}),
      });
      return json(200, {
        columns: describe(selected).columns,
        rows: expand(result.columns, result.rows),
        total: result.total,
        page,
        pageSize: size,
        hasMore: result.hasMore,
        offsetCap: MAX_OFFSET,
      });
    }

    // export
    const lines: string[] = [];
    const header = selected.columns.filter((c) => reveal || !c.masked);
    lines.push(header.map((c) => csvField(c.name)).join(","));
    let truncated = false;
    for (let offset = 0; offset < MAX_EXPORT_ROWS; offset += EXPORT_CHUNK) {
      const chunk = await within(
        readRows(db, selected, { ...base, limit: EXPORT_CHUNK, offset }, { withTotal: false }),
        timeoutMs,
      );
      for (const row of chunk.rows) lines.push(row.map(csvField).join(","));
      if (!chunk.hasMore) break;
      if (offset + EXPORT_CHUNK >= MAX_EXPORT_ROWS) truncated = true;
    }
    await audit(`db:export:${selected.name}`, "ok", {
      ...where,
      ...filtered,
      ...(reveal ? { revealed: true } : {}),
      truncated,
    });
    return new Response(`${lines.join("\r\n")}\r\n`, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${tool.name}-${selected.name}.csv"`,
        "cache-control": "no-store",
        ...(truncated ? { "x-forgeron-truncated": String(MAX_EXPORT_ROWS) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof QueryRefusal) {
      await audit(`db:${what}${table ? `:${decodeURIComponent(table)}` : ""}`, "denied", {
        ...where,
        code: error.code,
      });
      return failure(400, error.code, error.message);
    }
    if (error instanceof Timeout) {
      return failure(504, "TIMEOUT", "The database took too long to answer. Narrow the filter.");
    }
    // Whatever the host said stays on the server: it may carry account details.
    return failure(502, "DATABASE_UNAVAILABLE", "The database could not be read. Try again.");
  }
}
