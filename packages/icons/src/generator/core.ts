import type { IconManifestEntry } from "../types";
import { CURATED, OWN_ICONS, type CuratedMeta } from "./curated";
import { CATEGORIES, categoryOf, variantOf, wordsOf } from "./taxonomy";

// The generator as pure functions: from the name snapshot and the list of drawn icons to the
// content of every generated file. `scripts/generate.ts` does the reading and the writing.

/** The snapshot of the Iconify listing of Hugeicons, kept in `data/hugeicons-names.json`. */
export interface NameSnapshot {
  readonly source: string;
  /** When the listing was fetched (ISO 8601). */
  readonly fetchedAt: string;
  readonly prefix: string;
  readonly total: number;
  readonly title: string;
  /** Every visible name: Iconify files the whole set as uncategorized. */
  readonly uncategorized: readonly string[];
  /** Names Iconify hides (renamed or withdrawn): not in our catalog. */
  readonly hidden: readonly string[];
  /** Other name → name of the set: kept as aliases of their target. */
  readonly aliases: Readonly<Record<string, string>>;
}

/** What the generator needs to know of a drawn icon (a module of `src/drawn/`). */
export interface DrawnInfo {
  readonly name: string;
  readonly style: "pixel";
  readonly duo: boolean;
}

export interface GenerateInput {
  readonly snapshot: NameSnapshot;
  readonly drawn: readonly DrawnInfo[];
  readonly own?: readonly string[];
  readonly curated?: Readonly<Record<string, CuratedMeta>>;
}

export interface GenerateResult {
  readonly manifest: IconManifestEntry[];
  /** Path under `src/generated/` → content. */
  readonly files: Record<string, string>;
}

const NUMBER_WORDS: Record<string, string> = {
  "0": "Zero",
  "1": "One",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  "10": "Ten",
  "24": "TwentyFour",
};
const ORDINALS: Record<string, string> = { "1st": "First", "2nd": "Second", "3rd": "Third" };

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * The named export of an icon: PascalCase and `Icon`. A leading number is spelled out, since an
 * identifier cannot start with a digit: `1st-bracket` → `FirstBracketIcon`, `3d-move` →
 * `ThreeDMoveIcon`, `24-hours-clock` → `TwentyFourHoursClockIcon`.
 */
export function exportName(name: string): string {
  const parts = name.split("-").filter(Boolean);
  const head = parts[0] ?? "";
  const lead = /^(\d+)(.*)$/.exec(head);
  if (lead) {
    const [, digits = "", rest = ""] = lead;
    const spelled =
      ORDINALS[head] ??
      (NUMBER_WORDS[digits] ?? [...digits].map((d) => NUMBER_WORDS[d]).join("")) + capital(rest);
    parts[0] = spelled;
  }
  // Single digits next to each other are spelled too, or `arrow-down-0-1` would export the same
  // name as `arrow-down-01`: `sorting-1-9` → `SortingOneNineIcon`.
  const digit = (i: number) => /^\d$/.test(parts[i] ?? "");
  const spelledParts = parts.map((part, i) =>
    digit(i) && (digit(i - 1) || digit(i + 1)) ? (NUMBER_WORDS[part] ?? part) : part,
  );
  return `${spelledParts.map(capital).join("")}Icon`;
}

/** Words that a search for the name's words should also find. */
const SYNONYMS: Record<string, readonly string[]> = {
  add: ["new", "create", "plus"],
  remove: ["delete", "minus"],
  delete: ["remove", "trash", "bin"],
  edit: ["modify", "pencil", "write"],
  search: ["find", "magnifier", "lookup"],
  settings: ["gear", "preferences", "options"],
  user: ["person", "account", "profile"],
  mail: ["email", "message", "envelope"],
  message: ["chat", "conversation"],
  home: ["house", "start"],
  lock: ["secure", "private", "padlock"],
  trash: ["delete", "bin", "remove"],
  calendar: ["date", "schedule", "event"],
  clock: ["time", "hour"],
  cloud: ["online", "hosting"],
  download: ["save", "get"],
  upload: ["send", "put"],
  heart: ["like", "love", "favourite"],
  star: ["favourite", "rating"],
  alert: ["warning", "error"],
  notification: ["bell", "alert"],
  money: ["cash", "currency", "payment"],
  chart: ["graph", "statistics"],
  file: ["document"],
  folder: ["directory"],
  image: ["picture", "photo"],
  camera: ["photo"],
  video: ["movie", "film"],
  phone: ["call", "mobile"],
  call: ["phone"],
  location: ["place", "map", "pin"],
  link: ["url", "chain"],
  share: ["send", "social"],
  ai: ["artificial intelligence", "assistant"],
  code: ["programming", "developer"],
  git: ["version control"],
  database: ["storage", "data"],
  shield: ["security", "protection"],
  key: ["password", "secret"],
  check: ["done", "ok"],
  tick: ["done", "ok", "check"],
  cancel: ["close", "stop"],
};

const sentence = (words: readonly string[]) => capital(words.join(" "));

function labelsOf(name: string, category: string, curated?: CuratedMeta): string[] {
  const words = wordsOf(name);
  const label = CATEGORIES.find((c) => c.id === category)?.label.toLowerCase() ?? category;
  const out = new Set<string>([
    ...words,
    ...words.flatMap((w) => SYNONYMS[w] ?? []),
    ...label.split(/\s*&\s*/),
    ...(curated?.labels ?? []),
  ]);
  return [...out].filter((l) => l !== "");
}

function descriptionOf(name: string, category: string): string {
  const words = wordsOf(name);
  const variant = variantOf(name);
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const base = words.length > 0 ? sentence(words) : name;
  return `${base}${variant ? `, variant ${variant}` : ""}. ${label}.`;
}

/** The manifest, sorted by name, and checked: one entry per name, one export per entry. */
export function buildManifest(input: GenerateInput): IconManifestEntry[] {
  const { snapshot } = input;
  const own = input.own ?? OWN_ICONS;
  const curated = input.curated ?? CURATED;
  const hidden = new Set(snapshot.hidden);
  const huge = new Set(snapshot.uncategorized.filter((n) => !hidden.has(n)));
  const drawn = new Map(input.drawn.map((d) => [d.name, d]));

  for (const name of own) {
    if (huge.has(name)) throw new Error(`"${name}" is a Hugeicons name: remove it from OWN_ICONS.`);
  }
  for (const name of drawn.keys()) {
    if (!huge.has(name) && !own.includes(name)) {
      throw new Error(
        `The drawn icon "${name}" is neither a Hugeicons name nor listed in OWN_ICONS (curated.ts).`,
      );
    }
  }
  const categories = new Set(CATEGORIES.map((c) => c.id));
  for (const [name, meta] of Object.entries(curated)) {
    if (meta.category && !categories.has(meta.category)) {
      throw new Error(`curated.ts: "${name}" has the unknown category "${meta.category}".`);
    }
  }

  const names = [...new Set([...huge, ...own])].sort();
  const aliases = new Map<string, string[]>();
  const addAlias = (alias: string, target: string) => {
    if (names.includes(alias)) return;
    aliases.set(target, [...(aliases.get(target) ?? []), alias]);
  };
  // An alias may lead to another alias (`first-brecket-circle` → `first-bracket-circle` → …):
  // follow the chain to a visible name, or drop it.
  const resolve = (name: string): string | undefined => {
    let current: string | undefined = name;
    for (let hops = 0; current !== undefined && hops < 8; hops++) {
      if (huge.has(current)) return current;
      current = snapshot.aliases[current];
    }
    return undefined;
  };
  for (const alias of Object.keys(snapshot.aliases)) {
    const target = resolve(alias);
    if (target) addAlias(alias, target);
  }
  for (const [target, meta] of Object.entries(curated)) {
    for (const alias of meta.aliases ?? []) {
      if (names.includes(alias)) throw new Error(`curated.ts: the alias "${alias}" is a name.`);
      addAlias(alias, target);
    }
  }

  const exports = new Map<string, string>();
  return names.map((name) => {
    // Hugeicons lists a few names twice, with and without a hyphen before a number (`rows-2`,
    // `rows2`). Names are sorted, so the hyphenated one comes first and keeps the plain export;
    // the other marks the glued number with `_` (`Rows_2Icon`).
    let id = exportName(name);
    if (exports.has(id)) id = exportName(name.replace(/([a-z])(\d)/g, "$1_$2"));
    const clash = exports.get(id);
    if (clash) throw new Error(`"${name}" and "${clash}" would both export ${id}.`);
    exports.set(id, name);
    const meta = curated[name];
    const category = meta?.category ?? categoryOf(name);
    const art = drawn.get(name);
    return {
      name,
      export: id,
      source: huge.has(name) ? "hugeicons" : "forgeron",
      category,
      labels: labelsOf(name, category, meta),
      description: meta?.description ?? descriptionOf(name, category),
      implemented: art !== undefined,
      variants: { mono: art !== undefined, duo: art?.duo ?? false },
      style: art?.style ?? null,
      aliases: [...(aliases.get(name) ?? [])].sort(),
      reference: meta?.reference ?? null,
      trademark: meta?.trademark ?? null,
    } satisfies IconManifestEntry;
  });
}

const HEADER =
  "// Generated by `bun run generate` (packages/icons) from data/hugeicons-names.json and src/drawn/.\n" +
  "// Do not edit: draw an icon in src/drawn/<name>.ts, then run the generator.\n";

/** The shard of a name: its first letter, or `0-9` for a leading digit. */
export function shardOf(name: string): string {
  const first = name.charAt(0);
  return /[a-z]/.test(first) ? first : "0-9";
}

/** Every file of `src/generated/`, from the manifest. */
export function renderFiles(manifest: readonly IconManifestEntry[]): Record<string, string> {
  const shards = new Map<string, IconManifestEntry[]>();
  for (const entry of manifest) {
    const key = shardOf(entry.name);
    shards.set(key, [...(shards.get(key) ?? []), entry]);
  }
  const files: Record<string, string> = {};
  const keys = [...shards.keys()].sort();
  for (const key of keys) {
    const entries = shards.get(key) ?? [];
    const stubs = entries.some((e) => !e.implemented);
    const lines = entries.map((e) =>
      e.implemented
        ? `export { default as ${e.export} } from "../drawn/${e.name}";`
        : `export const ${e.export}: StubIcon = { name: "${e.name}", implemented: false };`,
    );
    files[`icons-${key}.ts`] =
      HEADER +
      (stubs ? 'import type { StubIcon } from "../types";\n\n' : "\n") +
      lines.join("\n") +
      "\n";
  }
  files["index.ts"] =
    HEADER + "\n" + keys.map((k) => `export * from "./icons-${k}";`).join("\n") + "\n";
  files["names.ts"] =
    HEADER +
    "\n/** Every name of the catalog. */\nexport type IconName =\n" +
    manifest.map((e) => `  | "${e.name}"`).join("\n") +
    ";\n";
  files["manifest.json"] =
    "[\n" + manifest.map((e) => `  ${JSON.stringify(e)}`).join(",\n") + "\n]\n";
  return files;
}

export function generate(input: GenerateInput): GenerateResult {
  const manifest = buildManifest(input);
  return { manifest, files: renderFiles(manifest) };
}
