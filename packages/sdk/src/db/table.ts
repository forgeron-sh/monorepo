import type { Column } from "./columns";

export interface IndexDef {
  columns: string[];
  unique: boolean;
}

export type Columns = Record<string, Column<any, any, any, any>>;

/** What `index(c.last_name)` takes: a reference to a column of the table being declared. */
export interface ColumnRef<Name extends string = string> {
  readonly column: Name;
}

export type ColumnRefs<C extends Columns> = { [K in keyof C & string]: ColumnRef<K> };

export interface Table<N extends string = string, C extends Columns = Columns> {
  readonly name: N;
  readonly columns: C;
  readonly indexes: readonly IndexDef[];
}

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

const namesOf = (refs: ColumnRef | readonly ColumnRef[]): string[] =>
  (Array.isArray(refs) ? refs : [refs]).map((ref) => (ref as ColumnRef).column);

export const index = (refs: ColumnRef | readonly ColumnRef[]): IndexDef => ({
  columns: namesOf(refs),
  unique: false,
});

export const unique = (refs: ColumnRef | readonly ColumnRef[]): IndexDef => ({
  columns: namesOf(refs),
  unique: true,
});

/** Declares a table: `table("deals", { id: t.id(), … }, (c) => [index(c.stage)])`. */
export function table<const N extends string, C extends Columns>(
  name: N,
  columns: C,
  indexes?: (columns: ColumnRefs<C>) => IndexDef[],
): Table<N, C> {
  if (!IDENTIFIER.test(name)) {
    throw new TypeError(`"${name}" is not a table name: use lower-case letters, digits and "_".`);
  }
  const names = Object.keys(columns);
  if (names.length === 0) throw new TypeError(`The table "${name}" has no column.`);
  for (const column of names) {
    if (!IDENTIFIER.test(column)) {
      throw new TypeError(
        `${name}.${column} is not a column name: use lower-case letters, digits and "_".`,
      );
    }
    const def = columns[column]!.def;
    if (def.kind === "enum") {
      const values = def.values ?? [];
      if (new Set(values).size !== values.length || values.some((v) => v.includes("'"))) {
        throw new TypeError(`${name}.${column}: enum values must be distinct and without a quote.`);
      }
      if (def.default?.kind === "value" && !values.includes(String(def.default.value))) {
        throw new TypeError(
          `${name}.${column}: the default "${String(def.default.value)}" is not one of the values.`,
        );
      }
    }
  }
  if (names.filter((n) => columns[n]!.def.kind === "id").length > 1) {
    throw new TypeError(`The table "${name}" has more than one id column.`);
  }

  const refs = Object.fromEntries(names.map((n) => [n, { column: n }])) as ColumnRefs<C>;
  const declared = indexes ? indexes(refs) : [];
  for (const declaredIndex of declared) {
    for (const column of declaredIndex.columns) {
      if (!(column in columns))
        throw new TypeError(`${name}: an index names "${column}", which is not a column.`);
    }
  }
  return { name, columns, indexes: declared };
}
