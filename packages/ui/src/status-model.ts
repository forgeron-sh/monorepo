// The states of a record, named once (D-157): a word, a tone and an optional glyph per key. Pure:
// no React here, a glyph is whatever the caller puts in (`ReactNode`, in practice).

/** The tones of `Led`, plus `strong` (the ink badge: sent, viewed). */
export type StatusTone = "neutral" | "success" | "warning" | "danger" | "accent" | "strong";

export interface StatusDefinition {
  /** The state in a word: shown next to the indicator, never replaced by colour. */
  label: string;
  tone: StatusTone;
  /** A mark that replaces the tone dot in pickers and in `StatusOf`. */
  glyph?: unknown;
  /** Where the state sits in `items` (ascending); the order of the definition by default. */
  order?: number;
}

type Definitions = Readonly<Record<string, StatusDefinition>>;

/** An option of `SelectMenu` and the pickers: `{ value, label, glyph? }`, plus the tone. */
export type StatusItem<T extends Definitions> = {
  [K in keyof T & string]: {
    value: K;
    label: string;
    tone: T[K]["tone"];
  } & (T[K] extends { glyph: infer G } ? { glyph: G } : unknown);
}[keyof T & string];

export interface StatusSet<T extends Definitions> {
  /** Every state in order, ready as the options of a `SelectMenu`. */
  readonly items: ReadonlyArray<StatusItem<T>>;
  /** The keys, in the same order. */
  readonly keys: ReadonlyArray<keyof T & string>;
  get<K extends keyof T & string>(key: K): StatusItem<T> & { value: K };
  /** Whether a word from outside (an API field) is one of the keys. */
  has(key: string): key is keyof T & string;
  label<K extends keyof T & string>(key: K): string;
  tone<K extends keyof T & string>(key: K): T[K]["tone"];
}

/** The key union of a set: `StatusKey<typeof INVOICE>`. */
export type StatusKey<S extends { readonly keys: ReadonlyArray<string> }> = S["keys"][number];

/**
 * Names the states of a record once. `items` goes straight into a picker, `tone(key)` and
 * `label(key)` into a badge or a `Status`; the key union is inferred (`StatusKey<typeof set>`).
 */
export function defineStatuses<const T extends Definitions>(definitions: T): StatusSet<T> {
  const entries = Object.entries(definitions).map(([key, def], index) => ({ key, def, index }));
  entries.sort((a, b) => (a.def.order ?? a.index) - (b.def.order ?? b.index) || a.index - b.index);
  const byKey = new Map<string, StatusItem<T>>();
  for (const { key, def } of entries) {
    const item: Record<string, unknown> = { value: key, label: def.label, tone: def.tone };
    if (def.glyph !== undefined) item.glyph = def.glyph;
    byKey.set(key, item as StatusItem<T>);
  }
  const items = entries.map(({ key }) => byKey.get(key) as StatusItem<T>);
  const need = (key: string) => {
    const item = byKey.get(key);
    if (!item) throw new Error(`Unknown status "${key}"`);
    return item;
  };
  return {
    items,
    keys: entries.map((e) => e.key) as ReadonlyArray<keyof T & string>,
    get: (key) => need(key) as never,
    has: (key): key is keyof T & string => byKey.has(key),
    label: (key) => need(key).label,
    tone: (key) => need(key).tone as never,
  };
}
