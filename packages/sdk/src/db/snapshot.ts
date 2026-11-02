import type { ColumnDef } from "./columns";
import type { IndexDef } from "./table";
import type { Schema } from "./schema";

// A schema as plain data: what `meta/snapshot.json` stores after each migration, and what two
// schemas are compared on (docs/sdk.md §8). Column order is kept: it is the order of the table.

export interface ColumnSnapshot extends ColumnDef {
  name: string;
}

export interface TableSnapshot {
  name: string;
  columns: ColumnSnapshot[];
  indexes: IndexDef[];
}

export interface Snapshot {
  version: 1;
  tables: TableSnapshot[];
}

export const emptySnapshot = (): Snapshot => ({ version: 1, tables: [] });

export function snapshotOf(schema: Schema): Snapshot {
  return {
    version: 1,
    tables: Object.values(schema.tables).map((table) => ({
      name: table.name,
      columns: Object.entries(table.columns).map(([name, column]) => ({ name, ...column.def })),
      indexes: table.indexes.map((index) => ({
        columns: [...index.columns],
        unique: index.unique,
      })),
    })),
  };
}

/** Two snapshots describe the same schema. */
export function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

// Keys in a fixed order and no `undefined`, so that a file round trip does not change the answer.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([x], [y]) => (x < y ? -1 : 1))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}
