// A D1 database reached through the Cloudflare API, shaped as the `D1Database` that `applyMigrations`
// and the registry use: `prepare().bind().all()` is one query, `batch()` is one request with
// several statements (`POST .../d1/database/<id>/query`, a `batch` of `{ sql, params }`).
// Whether the REST batch is one transaction has not been checked against a remote database.
import type { D1Database } from "../migrate";
import type { CloudflareClient } from "./cloudflare";

interface Statement {
  sql: string;
  params: unknown[];
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results?: unknown[] }>;
}

interface QueryResult {
  results?: unknown[];
}

export function createRestD1(client: CloudflareClient, databaseId: string): D1Database {
  const path = `/d1/database/${databaseId}/query`;
  // `bind` returns a new statement, as D1 does: one prepared statement is bound several times in a
  // batch (the registry's `saveGatewayCode`), and each binding must keep its own values.
  const make = (sql: string, params: unknown[]): Statement => ({
    sql,
    params,
    bind: (...values) => make(sql, values),
    async all() {
      const [first] = await client.request<QueryResult[]>("POST", path, { sql, params });
      return { results: first?.results ?? [] };
    },
  });
  const prepare = (sql: string): Statement => make(sql, []);
  return {
    prepare,
    async batch(statements) {
      const sent = statements as unknown as Statement[];
      return client.request<unknown[]>("POST", path, {
        batch: sent.map(({ sql, params }) => ({ sql, params })),
      });
    },
  } as D1Database;
}
