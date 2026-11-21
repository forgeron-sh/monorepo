import type { IconManifestEntry } from "../types";
import { ALIASES } from "./aliases";
import { CURATED, type CuratedMeta } from "./curated";
import { CATEGORIES, categoryOf, variantOf, wordsOf } from "./taxonomy";

// The generator as pure functions: from the drawn icons and the names that reuse them to the
// content of every generated file. `scripts/generate.ts` does the reading and the writing.

/** What the generator needs to know of a drawn icon (a module of `src/drawn/`). */
export interface DrawnInfo {
  readonly name: string;
  readonly style: "pixel";
  readonly duo: boolean;
  /** Grid and rows, to copy into the names drawn as this icon (`SAME_AS`). */
  readonly grid?: number;
  readonly rows?: readonly string[];
}

export interface GenerateInput {
  readonly drawn: readonly DrawnInfo[];
  readonly curated?: Readonly<Record<string, CuratedMeta>>;
  /** Other name → name of the catalog (`ALIASES` of `aliases.ts`). */
  readonly aliases?: Readonly<Record<string, string>>;
  /** Name → drawn icon whose drawing it reuses (`SAME_AS` of `same-as.ts`). Default: none. */
  readonly sameAs?: Readonly<Record<string, string>>;
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
  const curated = input.curated ?? CURATED;
  const sameAs = input.sameAs ?? {};
  const drawn = new Map(input.drawn.map((d) => [d.name, d]));

  const categories = new Set(CATEGORIES.map((c) => c.id));
  for (const [name, meta] of Object.entries(curated)) {
    if (meta.category && !categories.has(meta.category)) {
      throw new Error(`curated.ts: "${name}" has the unknown category "${meta.category}".`);
    }
  }
  for (const [name, target] of Object.entries(sameAs)) {
    if (drawn.has(name)) throw new Error(`same-as.ts: "${name}" has its own drawing.`);
    if (target in sameAs)
      throw new Error(`same-as.ts: "${name}" leads to "${target}", itself drawn as another icon.`);
    if (!drawn.has(target))
      throw new Error(`same-as.ts: "${name}" leads to "${target}", not drawn.`);
  }

  const names = [...new Set([...drawn.keys(), ...Object.keys(sameAs)])].sort();
  const known = new Set(names);
  const aliases = new Map<string, string[]>();
  const addAlias = (alias: string, target: string) => {
    if (known.has(alias)) throw new Error(`The alias "${alias}" is a name.`);
    if (!known.has(target))
      throw new Error(`The alias "${alias}" leads to "${target}", not a name.`);
    aliases.set(target, [...(aliases.get(target) ?? []), alias]);
  };
  for (const [alias, target] of Object.entries(input.aliases ?? ALIASES)) addAlias(alias, target);
  for (const [target, meta] of Object.entries(curated)) {
    for (const alias of meta.aliases ?? []) addAlias(alias, target);
  }

  const exports = new Map<string, string>();
  return names.map((name) => {
    // A few names differ only by a hyphen before a number (`rows-2`, `rows2`). Names are sorted,
    // so the hyphenated one comes first and keeps the plain export; the other marks the glued
    // number with `_` (`Rows_2Icon`).
    let id = exportName(name);
    if (exports.has(id)) id = exportName(name.replace(/([a-z])(\d)/g, "$1_$2"));
    const clash = exports.get(id);
    if (clash) throw new Error(`"${name}" and "${clash}" would both export ${id}.`);
    exports.set(id, name);
    const meta = curated[name];
    const category = meta?.category ?? categoryOf(name);
    const same = sameAs[name];
    const art = drawn.get(name) ?? drawn.get(same ?? "");
    return {
      name,
      export: id,
      category,
      labels: labelsOf(name, category, meta),
      description: meta?.description ?? descriptionOf(name, category),
      variants: { mono: true, duo: art?.duo ?? false },
      style: "pixel",
      aliases: [...(aliases.get(name) ?? [])].sort(),
      sameAs: same ?? null,
      reference: meta?.reference ?? null,
      trademark: meta?.trademark ?? null,
    } satisfies IconManifestEntry;
  });
}

const HEADER =
  "// Generated by `bun run generate` (packages/icons) from src/drawn/ and src/generator/.\n" +
  "// Do not edit: draw an icon in src/drawn/<name>.ts, then run the generator.\n";

/** The shard of a name: its first letter, or `0-9` for a leading digit. */
export function shardOf(name: string): string {
  const first = name.charAt(0);
  return /[a-z]/.test(first) ? first : "0-9";
}

/** Every file of `src/generated/`, from the manifest. */
export function renderFiles(
  manifest: readonly IconManifestEntry[],
  drawn: readonly DrawnInfo[] = [],
): Record<string, string> {
  const art = new Map(drawn.map((d) => [d.name, d]));
  const copy = (e: IconManifestEntry, target: string) => {
    const d = art.get(target);
    if (!d?.rows || d.grid === undefined)
      throw new Error(`"${e.name}" is drawn as "${target}", whose rows were not given.`);
    const rows = d.rows.map((r) => JSON.stringify(r)).join(", ");
    return `export const ${e.export}: PixelIcon = { name: "${e.name}", style: "pixel", grid: ${d.grid}, rows: [${rows}] };`;
  };
  const shards = new Map<string, IconManifestEntry[]>();
  for (const entry of manifest) {
    const key = shardOf(entry.name);
    shards.set(key, [...(shards.get(key) ?? []), entry]);
  }
  const files: Record<string, string> = {};
  const keys = [...shards.keys()].sort();
  for (const key of keys) {
    const entries = shards.get(key) ?? [];
    const copies = entries.some((e) => e.sameAs !== null);
    const lines = entries.map((e) =>
      e.sameAs !== null
        ? copy(e, e.sameAs)
        : `export { default as ${e.export} } from "../drawn/${e.name}";`,
    );
    files[`icons-${key}.ts`] =
      HEADER +
      (copies ? `import type { PixelIcon } from "../types";\n\n` : "\n") +
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
  return { manifest, files: renderFiles(manifest, input.drawn) };
}
