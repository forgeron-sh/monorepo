// The database explorer of the local harness: a small made-up CRM database, answered the way the
// gateway answers (paging, sorting, typed filters, masked columns, CSV). Nothing here is real data.

type Json = Record<string, any>;
type Kind = "integer" | "real" | "text";
interface Col {
  name: string;
  type: string;
  kind: Kind;
  notNull?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string | null;
  masked?: "tagged" | "name";
  fk?: { table: string; columns: string[] };
}

const NAMES = ["Ada", "Bob", "Claire", "Dev", "Eve", "Farah", "Gus", "Hana", "Ivan", "June"];
const companies = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"].map((name, i) => ({
  id: `c${i + 1}`,
  name,
  domain: i === 5 ? null : `${name.toLowerCase()}.example`,
}));
const contacts = Array.from({ length: 137 }, (_, i) => ({
  id: `k${String(i + 1).padStart(4, "0")}`,
  company_id: companies[i % companies.length]!.id,
  label: `${NAMES[i % NAMES.length]} ${i + 1}`,
  email: `${NAMES[i % NAMES.length]!.toLowerCase()}${i + 1}@${companies[i % companies.length]!.domain ?? "mail.example"}`,
  notes: i % 4 === 0 ? `Called on day ${i}` : null,
  visits: (i * 7) % 41,
}));

const TABLES: Record<string, { cols: Col[]; rows: Json[] }> = {
  companies: {
    cols: [
      { name: "id", type: "TEXT", kind: "text", primaryKey: true, notNull: true },
      { name: "name", type: "TEXT", kind: "text", notNull: true },
      { name: "domain", type: "TEXT", kind: "text", unique: true },
    ],
    rows: companies,
  },
  contacts: {
    cols: [
      { name: "id", type: "TEXT", kind: "text", primaryKey: true, notNull: true },
      {
        name: "company_id",
        type: "TEXT",
        kind: "text",
        fk: { table: "companies", columns: ["id"] },
      },
      { name: "label", type: "TEXT", kind: "text", notNull: true },
      { name: "email", type: "TEXT", kind: "text", unique: true, masked: "name" },
      { name: "notes", type: "TEXT", kind: "text", masked: "tagged" },
      { name: "visits", type: "INTEGER", kind: "integer", notNull: true, default: "0" },
    ],
    rows: contacts,
  },
};

const OPS: Record<Kind, string[]> = {
  text: ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "startsWith", "isNull", "notNull"],
  integer: ["eq", "neq", "gt", "gte", "lt", "lte", "isNull", "notNull"],
  real: ["eq", "neq", "gt", "gte", "lt", "lte", "isNull", "notNull"],
};
const describe = (name: string) => {
  const t = TABLES[name]!;
  const columns = t.cols.map((c) => ({
    name: c.name,
    type: c.type,
    kind: c.kind,
    notNull: !!c.notNull,
    primaryKey: !!c.primaryKey,
    unique: !!c.unique,
    default: c.default ?? null,
    masked: c.masked ?? null,
    operators: OPS[c.kind],
    foreignKey: c.fk ?? null,
  }));
  return {
    name,
    rows: t.rows.length,
    columns,
    indexes: t.cols
      .filter((c) => c.unique || c.primaryKey)
      .map((c) => ({
        name: `${name}_${c.name}_${c.primaryKey ? "pk" : "unique"}`,
        unique: true,
        origin: c.primaryKey ? "pk" : "u",
        columns: [c.name],
      })),
    foreignKeys: t.cols
      .filter((c) => c.fk)
      .map((c) => ({
        columns: [c.name],
        references: c.fk!,
        onUpdate: "NO ACTION",
        onDelete: "SET NULL",
      })),
  };
};

const matches = (row: Json, f: { column: string; op: string; value?: string }, kind: Kind) => {
  const v = row[f.column];
  if (f.op === "isNull") return v === null;
  if (f.op === "notNull") return v !== null;
  if (v === null) return false;
  const want = kind === "text" ? String(f.value) : Number(f.value);
  switch (f.op) {
    case "eq":
      return v === want;
    case "neq":
      return v !== want;
    case "gt":
      return v > want;
    case "gte":
      return v >= want;
    case "lt":
      return v < want;
    case "lte":
      return v <= want;
    case "contains":
      return String(v).includes(String(want));
    case "startsWith":
      return String(v).startsWith(String(want));
  }
  return false;
};

/** Answers a `/api/tools/<tool>/db/...` request, or `undefined`. */
export function mockDatabase(
  path: string,
  params: URLSearchParams,
): { status: number; body?: unknown; csv?: string } | undefined {
  const m =
    /^\/api\/tools\/[\w-]+\/db\/(environments|tables|schema)(?:\/([^/]+)(?:\/(rows|export))?)?$/.exec(
      path,
    );
  if (!m) return undefined;
  const [, what, tableName, view] = m;
  if (what === "environments")
    return {
      status: 200,
      body: {
        environments: [{ name: "production" }, { name: "preview", branch: "feat-contacts" }],
      },
    };
  if (params.get("env") === "preview" && params.get("branch") !== "feat-contacts")
    return { status: 404, body: { error: "NOT_FOUND", message: "There is no such environment." } };
  const names = Object.keys(TABLES).filter(
    (n) => params.get("env") !== "preview" || n !== "contacts",
  );
  const withPlatform = params.get("platform") === "1" ? [...names, "_forgeron_migrations"] : names;
  if (what === "schema") return { status: 200, body: { tables: names.map(describe) } };
  if (what === "tables" && !tableName)
    return {
      status: 200,
      body: {
        tables: withPlatform.map((n) =>
          TABLES[n]
            ? { name: n, rows: TABLES[n]!.rows.length, columns: TABLES[n]!.cols.length }
            : { name: n, rows: 3, columns: 2 },
        ),
      },
    };
  const t = TABLES[decodeURIComponent(tableName!)];
  if (!t || !names.includes(decodeURIComponent(tableName!)))
    return { status: 404, body: { error: "NOT_FOUND", message: "There is no such table." } };
  if (!view) return { status: 200, body: { table: describe(decodeURIComponent(tableName!)) } };

  const filters: Array<{ column: string; op: string; value?: string }> = JSON.parse(
    params.get("filter") ?? "[]",
  );
  const sort = params.get("sort");
  const hit = [...t.rows].filter((row) =>
    filters.every((f) => matches(row, f, t.cols.find((c) => c.name === f.column)!.kind)),
  );
  if (sort) {
    const dir = params.get("dir") === "desc" ? -1 : 1;
    hit.sort((a, b) =>
      a[sort] === b[sort]
        ? 0
        : a[sort] === null
          ? -1
          : b[sort] === null
            ? 1
            : a[sort] < b[sort]
              ? -dir
              : dir,
    );
  }
  const columns = describe(decodeURIComponent(tableName!)).columns;
  const cells = (row: Json) => columns.map((c) => (c.masked ? { masked: c.masked } : row[c.name]));
  if (view === "export") {
    const keep = columns.filter((c) => !c.masked);
    const csv = [
      keep.map((c) => c.name).join(","),
      ...hit.map((r) => keep.map((c) => r[c.name] ?? "").join(",")),
    ].join("\r\n");
    return { status: 200, csv };
  }
  const size = Math.min(Number(params.get("limit") ?? 50), 100);
  const page = Number(params.get("page") ?? 1);
  const slice = hit.slice((page - 1) * size, page * size);
  return {
    status: 200,
    body: {
      columns,
      rows: slice.map(cells),
      total: hit.length,
      page,
      pageSize: size,
      hasMore: page * size < hit.length,
      offsetCap: 10000,
    },
  };
}
