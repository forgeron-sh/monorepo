import {
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type CompiledQuery,
  type DatabaseConnection,
  type Dialect,
  type Driver,
  type QueryResult,
} from "kysely";

// `ctx.db`: Kysely on a D1 database (docs/sdk.md §8). D1 has no interactive transaction (D-012), so
// there is no `transaction()`: an action's writes are atomic in one `batch`.

interface D1Result {
  results?: unknown[];
  meta?: { changes?: number; last_row_id?: number };
}

/** What the runtime needs of a D1 database: the binding of a Worker has it, so does a test double. */
export interface D1Like {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result[]>;
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all(): Promise<D1Result>;
}

export interface BatchResult {
  rows: unknown[];
  changes: number;
}

export interface Compilable {
  compile(): { sql: string; parameters: readonly unknown[] };
}

export type Db = Kysely<any> & {
  /** Runs the statements in one atomic batch: all of them, or none. */
  batch(statements: readonly Compilable[]): Promise<BatchResult[]>;
};

const NO_TRANSACTION =
  "D1 has no interactive transaction: write atomically with ctx.db.batch([...]) (see D-012).";

// D1 binds null, numbers, strings and bytes: a boolean is 1 or 0, and `undefined` is NULL.
const bindable = (value: unknown): unknown =>
  typeof value === "boolean" ? Number(value) : (value ?? null);

const statement = (
  d1: D1Like,
  { sql, parameters }: { sql: string; parameters: readonly unknown[] },
) => d1.prepare(sql).bind(...parameters.map(bindable));

class D1Connection implements DatabaseConnection {
  readonly #d1: D1Like;

  constructor(d1: D1Like) {
    this.#d1 = d1;
  }

  async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    const { results = [], meta } = await statement(this.#d1, compiled).all();
    return {
      rows: results as R[],
      numAffectedRows: BigInt(meta?.changes ?? 0),
      ...(meta?.last_row_id === undefined ? {} : { insertId: BigInt(meta.last_row_id) }),
    };
  }

  // oxlint-disable-next-line require-yield -- an async generator that only refuses
  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("D1 does not stream query results.");
  }
}

class D1Driver implements Driver {
  readonly #connection: D1Connection;

  constructor(d1: D1Like) {
    this.#connection = new D1Connection(d1);
  }

  async init(): Promise<void> {}
  async acquireConnection(): Promise<DatabaseConnection> {
    return this.#connection;
  }
  async beginTransaction(): Promise<void> {
    throw new Error(NO_TRANSACTION);
  }
  async commitTransaction(): Promise<void> {
    throw new Error(NO_TRANSACTION);
  }
  async rollbackTransaction(): Promise<void> {
    throw new Error(NO_TRANSACTION);
  }
  async releaseConnection(): Promise<void> {}
  async destroy(): Promise<void> {}
}

/** Kysely over a D1 database, with `batch`. */
export function createDb(d1: D1Like): Db {
  const dialect: Dialect = {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new D1Driver(d1),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
  const kysely = new Kysely<any>({ dialect });
  const batch: Db["batch"] = async (statements) => {
    if (statements.length === 0) return [];
    const results = await d1.batch(statements.map((s) => statement(d1, s.compile())));
    return results.map((r) => ({ rows: r.results ?? [], changes: r.meta?.changes ?? 0 }));
  };
  return Object.assign(kysely, { batch });
}
