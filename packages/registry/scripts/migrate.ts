// Applies the platform D1 migrations before a deployment (.github/workflows/deploy.yml).
// Reads CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and PLATFORM_D1_ID from the environment and
// talks to the D1 REST API (`POST /accounts/<id>/d1/database/<id>/query`, a `batch` of statements).
// Not run against a remote database yet: whether the REST batch is one transaction is to check on
// the first deployment, see the note in the Linear ticket FOR-23.
import type { D1Database } from "@forgeron/hosting";
import { migratePlatform } from "../src/index";

const need = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
};

const url = `https://api.cloudflare.com/client/v4/accounts/${need("CLOUDFLARE_ACCOUNT_ID")}/d1/database/${need("PLATFORM_D1_ID")}/query`;
const token = need("CLOUDFLARE_API_TOKEN");

interface Statement {
  sql: string;
  params: unknown[];
}

async function query(body: Statement | { batch: Statement[] }) {
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    success: boolean;
    errors?: { message: string }[];
    result?: { results?: unknown[] }[];
  };
  if (!response.ok || !payload.success) {
    throw new Error(
      `D1 query failed (${response.status}): ${payload.errors?.map((e) => e.message).join("; ") ?? "no detail"}`,
    );
  }
  return payload.result ?? [];
}

const prepare = (sql: string) => {
  const statement = {
    sql,
    params: [] as unknown[],
    bind(...values: unknown[]) {
      statement.params = values;
      return statement;
    },
    async all() {
      return { results: (await query({ sql, params: statement.params }))[0]?.results ?? [] };
    },
  };
  return statement;
};

const d1 = {
  prepare,
  async batch(statements: ReturnType<typeof prepare>[]) {
    return query({ batch: statements.map(({ sql, params }) => ({ sql, params })) });
  },
} as unknown as D1Database;

const { applied } = await migratePlatform(d1);
console.log(applied.length ? `Applied: ${applied.join(", ")}` : "The platform D1 is up to date.");
