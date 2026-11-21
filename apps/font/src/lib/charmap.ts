/**
 * The character map of the font, grouped and counted from its `cmap`: nothing here lists
 * characters by hand, so coverage can only be what the files really contain.
 */

export type CharGroup =
  | "uppercase"
  | "lowercase"
  | "accented"
  | "figures"
  | "punctuation"
  | "symbols"
  | "space";

export const GROUP_LABELS: Record<CharGroup, string> = {
  uppercase: "Uppercase",
  lowercase: "Lowercase",
  accented: "Accented",
  figures: "Figures",
  punctuation: "Punctuation",
  symbols: "Symbols",
  space: "Space",
};

const GROUP_ORDER: readonly CharGroup[] = [
  "uppercase",
  "lowercase",
  "accented",
  "figures",
  "punctuation",
  "symbols",
  "space",
];

/** The group of a code point, from Unicode properties and canonical decomposition. */
export function classify(cp: number): CharGroup {
  const ch = String.fromCodePoint(cp);
  if (/\s/u.test(ch)) return "space";
  if (/\p{L}/u.test(ch) && ch.normalize("NFD").length > 1) return "accented";
  if (/\p{Lu}/u.test(ch)) return "uppercase";
  if (/\p{Ll}/u.test(ch)) return "lowercase";
  if (/\p{Nd}/u.test(ch)) return "figures";
  if (/\p{P}/u.test(ch)) return "punctuation";
  return "symbols";
}

/** `U+0041`. */
export function codepointLabel(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** Code points grouped in display order, each group sorted. Empty groups are left out. */
export function groupCodepoints(cps: Iterable<number>): { group: CharGroup; cps: number[] }[] {
  const buckets = new Map<CharGroup, number[]>();
  for (const cp of cps) {
    const g = classify(cp);
    buckets.set(g, [...(buckets.get(g) ?? []), cp]);
  }
  return GROUP_ORDER.flatMap((group) => {
    const list = buckets.get(group);
    return list ? [{ group, cps: [...list].sort((a, b) => a - b) }] : [];
  });
}

/** The distinct characters of `text` the font does not map (line breaks aside). */
export function missingChars(
  text: string,
  cmap: ReadonlySet<number> | ReadonlyMap<number, unknown>,
): string[] {
  const out = new Set<string>();
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\n" || ch === "\r") continue;
    if (!cmap.has(cp)) out.add(ch);
  }
  return [...out];
}
