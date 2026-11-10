// Copying a branch's data into another branch (D-121): an admin starts a branch from the data of
// another one. Never production's, either way: that is the caller's rule. Both databases must be on
// the same migrations; the target's tables are emptied, then filled with the source's rows, parents
// before children. The platform's own tables (`_forgeron_*`, `_cf_*`, `sqlite_*`) are left alone.
import type { D1Database } from "@forgeron/hosting";

export class CopyError extends Error {
  override name = "CopyError";
  constructor(
    readonly code: "SCHEMA_DIFFERS" | "TOO_LARGE",
    message: string,
  ) {
    super(message);
  }
}

/** Rows copied at most: the copy runs in one request of the gateway. */
const MAX_COPY_ROWS = 50_000;
const PAGE = 200;

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;

async function rows(db: D1Database, sql: string, ...values: unknown[]) {
  const result = await db
    .prepare(sql)
    .bind(...values)
    .all();
  return (result.results ?? []) as Array<Record<string, unknown>>;
}

async function migrationsOf(db: D1Database): Promise<string[]> {
  try {
    return (await rows(db, `SELECT "name" FROM "_forgeron_migrations" ORDER BY "name"`)).map((r) =>
      String(r.name),
    );
  } catch {
    // A database no migration ran on.
    return [];
  }
}

/** The tool's tables, parents before the tables that reference them. */
async function tablesOf(db: D1Database): Promise<string[]> {
  const names = (
    await rows(
      db,
      `SELECT "name" FROM "sqlite_master" WHERE "type" = 'table' AND "name" NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND "name" NOT LIKE '\\_forgeron\\_%' ESCAPE '\\' AND "name" NOT LIKE '\\_cf\\_%' ESCAPE '\\' ORDER BY "name"`,
    )
  ).map((r) => String(r.name));
  const parents = new Map<string, Set<string>>();
  for (const name of names) {
    const refs = await rows(db, `SELECT "table" FROM pragma_foreign_key_list(?)`, name);
    parents.set(name, new Set(refs.map((r) => String(r.table)).filter((t) => t !== name)));
  }
  const ordered: string[] = [];
  const visiting = new Set<string>();
  const visit = (name: string) => {
    if (ordered.includes(name) || visiting.has(name)) return;
    visiting.add(name);
    for (const parent of parents.get(name) ?? []) if (parents.has(parent)) visit(parent);
    ordered.push(name);
  };
  names.forEach(visit);
  return ordered;
}

export async function copyDatabase(
  from: D1Database,
  to: D1Database,
  maxRows = MAX_COPY_ROWS,
): Promise<Array<{ name: string; rows: number }>> {
  const [source, target] = await Promise.all([migrationsOf(from), migrationsOf(to)]);
  if (source.join("\n") !== target.join("\n")) {
    throw new CopyError(
      "SCHEMA_DIFFERS",
      "The two branches are not on the same migrations: deploy them from the same code first.",
    );
  }
  const tables = await tablesOf(from);
  const counts = new Map<string, number>();
  let total = 0;
  for (const table of tables) {
    const [row] = await rows(from, `SELECT COUNT(*) AS "n" FROM ${quote(table)}`);
    const n = Number(row?.n ?? 0);
    counts.set(table, n);
    total += n;
  }
  if (total > maxRows) {
    throw new CopyError(
      "TOO_LARGE",
      `The branch has ${total} rows; at most ${maxRows} are copied.`,
    );
  }
  // Children before parents when emptying; references are checked at the end of each batch.
  await to.batch([
    to.prepare(`PRAGMA defer_foreign_keys = ON`),
    ...[...tables].reverse().map((t) => to.prepare(`DELETE FROM ${quote(t)}`)),
  ]);
  for (const table of tables) {
    for (let offset = 0; offset < (counts.get(table) ?? 0); offset += PAGE) {
      const page = await rows(
        from,
        `SELECT * FROM ${quote(table)} ORDER BY rowid LIMIT ? OFFSET ?`,
        PAGE,
        offset,
      );
      if (page.length === 0) break;
      const columns = Object.keys(page[0]!);
      const insert = `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
      await to.batch([
        to.prepare(`PRAGMA defer_foreign_keys = ON`),
        ...page.map((row) => to.prepare(insert).bind(...columns.map((c) => row[c] ?? null))),
      ]);
    }
  }
  return tables.map((name) => ({ name, rows: counts.get(name) ?? 0 }));
}
