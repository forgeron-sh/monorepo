// The shape of the files the gallery fetches (`/data/<version>/…`), shared by the build that
// writes them and the browser that reads them. Arrays, not objects: the keys would be most of
// the bytes.

/** `/data/<version>/index.json`: everything search and the sidebar need, no drawing. */
export interface IndexFile {
  readonly version: string;
  readonly batchCount: number;
  /** `[id, label]`, in the order of the sidebar. */
  readonly categories: readonly (readonly [string, string])[];
  /** `[name, category, labels other than the words of the name, aliases, duo (0 or 1), batch]`. */
  readonly entries: readonly (readonly [
    string,
    string,
    readonly string[],
    readonly string[],
    0 | 1,
    number,
  ])[];
}

/** `/data/<version>/<batch>.json`: name → `[grid, rows, export, description, sameAs, reference, trademark]`. */
export type BatchFile = Record<
  string,
  readonly [number, readonly string[], string, string, string | null, string | null, string | null]
>;

export const indexUrl = (version: string) => `/data/${version}/index.json`;
export const batchUrl = (version: string, batch: number) => `/data/${version}/${batch}.json`;
