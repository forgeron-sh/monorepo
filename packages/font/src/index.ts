/**
 * Forge Sans: the bitmap face of the brand, drawn on a 5-pixel grid. The one copy of the face in
 * the repository: the labels of a scene, the site's titles, wordmark and indices all read it.
 * Rows run from -2 (accents on capitals) to 8 (descenders); the baseline sits under row 6.
 * Capitals and figures fill rows 0–6, lowercase letters have an x-height of 5 (rows 2–6).
 */

export interface Glyph {
  /** Row of the first line of `rows` (0 = cap height, 2 = x-height). */
  top: number;
  rows: string[];
}

const cap = (...rows: string[]): Glyph => ({ top: 0, rows });
const x = (...rows: string[]): Glyph => ({ top: 2, rows });

const BASE: Record<string, Glyph> = {
  A: cap(".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"),
  B: cap("####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."),
  C: cap(".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."),
  D: cap("####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."),
  E: cap("#####", "#....", "#....", "####.", "#....", "#....", "#####"),
  F: cap("#####", "#....", "#....", "####.", "#....", "#....", "#...."),
  G: cap(".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"),
  H: cap("#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"),
  I: cap("###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"),
  J: cap("..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."),
  K: cap("#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"),
  L: cap("#....", "#....", "#....", "#....", "#....", "#....", "#####"),
  M: cap("#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"),
  N: cap("#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#...#", "#...#"),
  O: cap(".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."),
  P: cap("####.", "#...#", "#...#", "####.", "#....", "#....", "#...."),
  Q: cap(".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"),
  R: cap("####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"),
  S: cap(".####", "#....", "#....", ".###.", "....#", "....#", "####."),
  T: cap("#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."),
  U: cap("#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."),
  V: cap("#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."),
  W: cap("#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"),
  X: cap("#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"),
  Y: cap("#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."),
  Z: cap("#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"),

  a: x(".###.", "....#", ".####", "#...#", ".####"),
  b: cap("#....", "#....", "####.", "#...#", "#...#", "#...#", "####."),
  c: x(".####", "#....", "#....", "#....", ".####"),
  d: cap("....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"),
  e: x(".###.", "#...#", "#####", "#....", ".####"),
  f: cap("..##", ".#..", "###.", ".#..", ".#..", ".#..", ".#.."),
  g: x(".####", "#...#", "#...#", "#...#", ".####", "....#", ".###."),
  h: cap("#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"),
  i: cap("#", ".", "#", "#", "#", "#", "#"),
  j: cap("..#", "...", "..#", "..#", "..#", "..#", "..#", "..#", "##."),
  k: cap("#...", "#...", "#..#", "#.#.", "##..", "#.#.", "#..#"),
  l: cap("#.", "#.", "#.", "#.", "#.", "#.", ".#"),
  m: x("####.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"),
  n: x("####.", "#...#", "#...#", "#...#", "#...#"),
  o: x(".###.", "#...#", "#...#", "#...#", ".###."),
  p: x("####.", "#...#", "#...#", "#...#", "####.", "#....", "#...."),
  q: x(".####", "#...#", "#...#", "#...#", ".####", "....#", "....#"),
  r: x("#.##", "##..", "#...", "#...", "#..."),
  s: x(".####", "#....", ".###.", "....#", "####."),
  t: cap(".#..", ".#..", "###.", ".#..", ".#..", ".#..", "..##"),
  u: x("#...#", "#...#", "#...#", "#...#", ".####"),
  v: x("#...#", "#...#", "#...#", ".#.#.", "..#.."),
  w: x("#...#", "#...#", "#.#.#", "#.#.#", ".#.#."),
  x: x("#...#", ".#.#.", "..#..", ".#.#.", "#...#"),
  y: x("#...#", "#...#", "#...#", "#...#", ".####", "....#", ".###."),
  z: x("#####", "...#.", "..#..", ".#...", "#####"),

  "0": cap(".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."),
  "1": cap("..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."),
  "2": cap(".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"),
  "3": cap("####.", "....#", "....#", ".###.", "....#", "....#", "####."),
  "4": cap("...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."),
  "5": cap("#####", "#....", "####.", "....#", "....#", "#...#", ".###."),
  "6": cap(".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."),
  "7": cap("#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."),
  "8": cap(".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."),
  "9": cap(".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."),

  " ": cap("...", "...", "...", "...", "...", "...", "..."),
  ".": { top: 5, rows: [".#.", ".#."] },
  ",": { top: 5, rows: [".#", ".#", "#."] },
  ":": { top: 1, rows: ["##", "##", "..", "..", "##", "##"] },
  ";": { top: 1, rows: [".#", ".#", "..", "..", ".#", ".#", "#."] },
  "'": cap("#", "#"),
  '"': cap("#.#", "#.#"),
  "!": cap("#", "#", "#", "#", "#", ".", "#"),
  "?": cap(".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."),
  "-": { top: 3, rows: ["###"] },
  _: { top: 7, rows: ["#####"] },
  "+": { top: 1, rows: [".....", "..#..", "..#..", "#####", "..#..", "..#.."] },
  "=": { top: 2, rows: ["####", "....", "####"] },
  "*": { top: 1, rows: ["#.#.#", ".###.", "#.#.#"] },
  "/": cap("....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."),
  "\\": cap("#....", "#....", ".#...", "..#..", "...#.", "....#", "....#"),
  "(": cap("..#", ".#.", "#..", "#..", "#..", ".#.", "..#"),
  ")": cap("#..", ".#.", "..#", "..#", "..#", ".#.", "#.."),
  "[": cap("###", "#..", "#..", "#..", "#..", "#..", "###"),
  "]": cap("###", "..#", "..#", "..#", "..#", "..#", "###"),
  "<": cap("...#", "..#.", ".#..", "#...", ".#..", "..#.", "...#"),
  ">": cap("#...", ".#..", "..#.", "...#", "..#.", ".#..", "#..."),
  "%": cap("##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"),
  "&": cap(".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"),
  "#": { top: 1, rows: [".#.#.", "#####", ".#.#.", "#####", ".#.#."] },
  "@": cap(".###.", "#...#", "#.###", "#.#.#", "#.###", "#....", ".####"),
  $: cap("..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."),
  "·": { top: 3, rows: ["#"] },
  "→": { top: 1, rows: ["..#..", "...#.", "#####", "...#.", "..#.."] },
  "←": { top: 1, rows: ["..#..", ".#...", "#####", ".#...", "..#.."] },
  "↓": cap("..#..", "..#..", "..#..", "#.#.#", ".###.", "..#.."),
  "×": { top: 1, rows: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"] },
  "°": cap(".#.", "#.#", ".#."),
  "■": { top: 2, rows: ["###", "###", "###"] },
  "€": cap("..###", ".#...", "####.", ".#...", "####.", ".#...", "..###"),
};

/** Accents, as rows drawn just above the letter, 5 pixels wide. */
const MARKS: Record<string, string[]> = {
  acute: ["...#.", "..#.."],
  grave: [".#...", "..#.."],
  circ: ["..#..", ".#.#."],
  diaer: [".#.#."],
};
const ACCENTED: Record<string, [string, keyof typeof MARKS]> = {
  É: ["E", "acute"],
  È: ["E", "grave"],
  Ê: ["E", "circ"],
  Ë: ["E", "diaer"],
  À: ["A", "grave"],
  Â: ["A", "circ"],
  Ô: ["O", "circ"],
  Û: ["U", "circ"],
  Ù: ["U", "grave"],
  Ü: ["U", "diaer"],
  é: ["e", "acute"],
  è: ["e", "grave"],
  ê: ["e", "circ"],
  ë: ["e", "diaer"],
  à: ["a", "grave"],
  â: ["a", "circ"],
  ô: ["o", "circ"],
  û: ["u", "circ"],
  ù: ["u", "grave"],
  ü: ["u", "diaer"],
};

function withMark(base: Glyph, mark: string[]): Glyph {
  const w = base.rows[0]?.length ?? 5;
  const pad = Math.max(0, Math.floor((w - 5) / 2));
  const marks = mark.map((r) => (".".repeat(pad) + r).slice(0, w).padEnd(w, "."));
  return { top: base.top - marks.length, rows: [...marks, ...base.rows] };
}

function buildTable(BASE: Record<string, Glyph>): Record<string, Glyph> {
  const table: Record<string, Glyph> = { ...BASE };
  for (const [char, [base, mark]] of Object.entries(ACCENTED)) {
    const g = BASE[base];
    const m = MARKS[mark];
    if (g && m) table[char] = withMark(g, m);
  }
  // Dotless i under an accent, centred on 3 columns; cedillas under C and c.
  const iMarks: Record<string, string[]> = { î: [".#.", "#.#"], ï: ["#.#"] };
  for (const [char, mark] of Object.entries(iMarks))
    table[char] = { top: 2 - mark.length, rows: [...mark, ".#.", ".#.", ".#.", ".#.", ".#."] };
  table.Î = { top: -2, rows: [".#.", "#.#", ...BASE.I!.rows] };
  table.Ç = { top: 0, rows: [...BASE.C!.rows, "..#..", ".##.."] };
  table.ç = { top: 2, rows: [...BASE.c!.rows, "..#..", ".##.."] };
  table["’"] = BASE["'"]!;
  return table;
}

/** The face of the wordmark and the section indices (SVG). */
export const GLYPHS: Record<string, Glyph> = buildTable(BASE);

/**
 * Squared letters for the Forge Sans font: closed rectangular counters instead of cut corners,
 * so titles read as an industrial display face rather than an 8-bit one. Figures stay as in the indices.
 */
const SQUARE: Record<string, Glyph> = {
  A: cap("#####", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"),
  B: cap("####.", "#...#", "#...#", "#####", "#...#", "#...#", "#####"),
  C: cap("#####", "#....", "#....", "#....", "#....", "#....", "#####"),
  G: cap("#####", "#....", "#....", "#.###", "#...#", "#...#", "#####"),
  J: cap("....#", "....#", "....#", "....#", "....#", "#...#", "#####"),
  O: cap("#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"),
  Q: cap("#####", "#...#", "#...#", "#...#", "#.#.#", "#..##", "#####"),
  S: cap("#####", "#....", "#....", "#####", "....#", "....#", "#####"),
  U: cap("#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"),
  a: x("####.", "....#", "#####", "#...#", "#####"),
  b: cap("#....", "#....", "#####", "#...#", "#...#", "#...#", "#####"),
  c: x("#####", "#....", "#....", "#....", "#####"),
  d: cap("....#", "....#", "#####", "#...#", "#...#", "#...#", "#####"),
  e: x("#####", "#...#", "#####", "#....", "#####"),
  g: x("#####", "#...#", "#...#", "#...#", "#####", "....#", "#####"),
  h: cap("#....", "#....", "#####", "#...#", "#...#", "#...#", "#...#"),
  m: x("#####", "#.#.#", "#.#.#", "#.#.#", "#.#.#"),
  n: x("#####", "#...#", "#...#", "#...#", "#...#"),
  o: x("#####", "#...#", "#...#", "#...#", "#####"),
  p: x("#####", "#...#", "#...#", "#...#", "#####", "#....", "#...."),
  q: x("#####", "#...#", "#...#", "#...#", "#####", "....#", "....#"),
  s: x("#####", "#....", "#####", "....#", "#####"),
  u: x("#...#", "#...#", "#...#", "#...#", "#####"),
  y: x("#...#", "#...#", "#...#", "#...#", "#####", "....#", "#####"),
};

/** Forge Sans, the font: the index face with squared letters. */
export const FORGE_SANS: Record<string, Glyph> = buildTable({ ...BASE, ...SQUARE });

/** Pixel bold: every row OR-ed with itself shifted one column right. */
export function embolden(g: Glyph): Glyph {
  return {
    top: g.top,
    rows: g.rows.map((r) => {
      let out = "";
      for (let i = 0; i <= r.length; i++) out += r[i] === "#" || r[i - 1] === "#" ? "#" : ".";
      return out;
    }),
  };
}

export const glyphWidth = (g: Glyph) => g.rows[0]?.length ?? 3;

/** The glyph of `char` in the index face, or a space when the face lacks it. */
export function glyph(char: string): Glyph {
  return GLYPHS[char] ?? (GLYPHS[" "] as Glyph);
}

/** Width of `text` in pixels as a label draws it: glyphs plus one column between them. */
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += glyphWidth(glyph(ch)) + 1;
  return Math.max(0, w - 1);
}

/** Upper-cases and drops diacritics: the historical behaviour of section titles and indices. */
function upper(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .toUpperCase();
}

export interface TextSvgOptions {
  /** Keep case and accents (rows -2 to 8) instead of upper-casing (rows 0 to 6). */
  keepCase?: boolean;
  bold?: boolean;
}

/**
 * `text` in Forge Sans as static SVG: square pixels, one unit each, one column between letters,
 * `currentColor`, so the text follows the theme without JavaScript.
 */
export function textSvg(text: string, opts: TextSvgOptions = {}): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const char of opts.keepCase ? text : upper(text)) {
    const base = GLYPHS[char] ?? GLYPHS[" "];
    if (!base) continue;
    const g = opts.bold ? embolden(base) : base;
    g.rows.forEach((row, i) => {
      [...row].forEach((px, x) => {
        if (px === "#") parts.push(`M${cursor + x} ${g.top + i}h1v1h-1z`);
      });
    });
    cursor += glyphWidth(g) + 1;
  }
  const width = Math.max(1, cursor - 1);
  const box = opts.keepCase ? `0 -2 ${width} 11` : `0 0 ${width} 7`;
  return `<svg viewBox="${box}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="${parts.join("")}"/></svg>`;
}
