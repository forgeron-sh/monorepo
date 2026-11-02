import type { D1Like, D1Statement } from "@forgeron/runtime";
import { DatabaseSync } from "node:sqlite";

// A D1 database in memory, for tests: SQLite from Node, with the surface of a D1 binding that the
// runtime uses. A batch is atomic, as on D1: it runs in one transaction and rolls back on failure.

interface Result {
  results: unknown[];
  meta: { changes: number; last_row_id: number };
}

function execute(db: DatabaseSync, sql: string, params: unknown[]): Result {
  const total = () => (db.prepare("SELECT total_changes() AS n").get() as { n: number }).n;
  const before = total();
  const results = db.prepare(sql).all(...(params as never[])) as unknown[];
  const last = db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number };
  return { results, meta: { changes: total() - before, last_row_id: last.id } };
}

class Statement implements D1Statement {
  readonly #db: DatabaseSync;
  readonly sql: string;
  readonly params: unknown[];

  constructor(db: DatabaseSync, sql: string, params: unknown[] = []) {
    this.#db = db;
    this.sql = sql;
    this.params = params;
  }

  bind(...values: unknown[]): Statement {
    return new Statement(this.#db, this.sql, values);
  }

  async all(): Promise<Result> {
    return execute(this.#db, this.sql, this.params);
  }
}

export interface MemoryD1 extends D1Like {
  /** Runs one statement, or several: for setting a test up. */
  exec(sql: string): Promise<void>;
  close(): void;
}

export function createMemoryD1(): MemoryD1 {
  const db = new DatabaseSync(":memory:");
  // D1 enforces foreign keys.
  db.exec("PRAGMA foreign_keys = ON");
  return {
    prepare: (sql) => new Statement(db, sql),
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = (statements as Statement[]).map((s) => execute(db, s.sql, s.params));
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async exec(sql) {
      db.exec(sql);
    },
    close: () => db.close(),
  };
}
