import type { Kysely } from "kysely";
import type { ColumnOf } from "./columns";
import type { Columns, Table } from "./table";

export type Tables = Record<string, Table<string, Columns>>;

export interface Schema<T extends Tables = Tables> {
  readonly tables: T;
}

/** The set of tables of a tool: `export default schema({ companies, contacts, deals })`. */
export function schema<const T extends Tables>(tables: T): Schema<T> {
  for (const [key, declared] of Object.entries(tables)) {
    if (key !== declared.name) {
      throw new TypeError(
        `The table "${declared.name}" is listed as "${key}": a table has one name, in the schema, the database and queries.`,
      );
    }
  }
  for (const declared of Object.values(tables)) {
    for (const [column, builder] of Object.entries(declared.columns)) {
      const target = builder.def.references;
      if (target === undefined) continue;
      const other = tables[target];
      if (!other)
        throw new TypeError(
          `${declared.name}.${column} points at "${target}", which is not in the schema.`,
        );
      if (other.columns.id?.def.kind !== "id") {
        throw new TypeError(
          `${declared.name}.${column} points at "${target}", which has no id column.`,
        );
      }
    }
  }
  return { tables };
}

/** The Kysely database type of a schema: one entry per table, one column type per column. */
export type DB<S extends Schema> = {
  [K in keyof S["tables"]]: {
    [C in keyof S["tables"][K]["columns"]]: ColumnOf<S["tables"][K]["columns"][C]>;
  };
};

/** What a batch statement gives back: the rows it returned, and how many rows it changed. */
export interface BatchResult {
  rows: unknown[];
  changes: number;
}

/** Anything Kysely can compile: a SELECT, an INSERT, an UPDATE… */
export interface Compilable {
  compile(): { sql: string; parameters: readonly unknown[] };
}

export interface Batch {
  /**
   * Runs the statements in one atomic batch: all of them, or none (D-012). D1 has no interactive
   * transaction, so this is how an action makes several writes succeed or fail together.
   */
  batch(statements: readonly Compilable[]): Promise<BatchResult[]>;
}

/** What `ctx.db` is for a tool whose schema is `S`: a typed Kysely, plus `batch`. */
export type Database<S extends Schema = Schema> = Kysely<DB<S>> & Batch;
