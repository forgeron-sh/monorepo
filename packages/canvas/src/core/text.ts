// Text laid out without a page: the lines a text wraps into, where each glyph of a line sits, a
// line cut with an ellipsis. Pure, on top of the metrics of a font (`FarTextMetrics`): the browser
// gives its own (`textMetrics` of `@forgeron/canvas/react`, from the font the DOM uses), so the
// GPU's words fall where the DOM's would. The rules are the DOM's for `white-space: pre-wrap` and
// `overflow-wrap: anywhere`: hard breaks, breaks after spaces (which hang at the end of a line),
// after a hyphen or an en dash and around an em dash inside a word, a word longer than a line
// broken where it reaches the edge.

/** A font: the family token (`sans`, `mono`), a size in world units, a weight. */
export interface FarFont {
  family?: "sans" | "mono";
  size: number;
  weight?: number;
}

/** What a layout needs of a font, in world units at the font's size. */
export interface FarTextMetrics {
  /** The advance of a cluster (a character, or a ligature's letters). */
  advance(font: FarFont, cluster: string): number;
  /** The kerning between two clusters, added after the first. */
  kern(font: FarFont, a: string, b: string): number;
  /** Where the baseline sits in a line box `lineHeight` high, from its top. */
  baseline(font: FarFont, lineHeight: number): number;
}

/**
 * The sequences a font may draw as one ligature: kept together, so a glyph drawn whole is the
 * ligature when the font has one and the same letters when it has not.
 */
const LIGATURE = /^(?:ffi|ffl|ff|fi|fl)/;

/** A text as clusters: its characters (code points), the f-ligatures kept whole. */
export function clusters(text: string): string[] {
  const out: string[] = [];
  const chars = [...text];
  for (let i = 0; i < chars.length;) {
    if (chars[i] === "f") {
      const m = LIGATURE.exec(chars.slice(i, i + 3).join(""));
      if (m) {
        out.push(m[0]);
        i += m[0].length;
        continue;
      }
    }
    out.push(chars[i]!);
    i++;
  }
  return out;
}

/** A line's clusters and where each starts from the line's left end, and its width. */
export interface PlacedLine {
  clusters: string[];
  xs: number[];
  width: number;
}

export function placeLine(m: FarTextMetrics, font: FarFont, text: string): PlacedLine {
  const cs = clusters(text);
  const xs: number[] = [];
  let x = 0;
  for (let i = 0; i < cs.length; i++) {
    xs.push(x);
    x += m.advance(font, cs[i]!);
    if (i + 1 < cs.length) x += m.kern(font, cs[i]!, cs[i + 1]!);
  }
  return { clusters: cs, xs, width: x };
}

/** The width of a line, its spaces at the end left out (they hang past the edge). */
export function lineWidth(m: FarTextMetrics, font: FarFont, text: string): number {
  return placeLine(m, font, text.replace(/ +$/, "")).width;
}

/**
 * A word cut where a line may break inside it (Unicode line breaking, the cases a board meets):
 * after a hyphen not at its start and not before a figure, after an en dash, before and after an
 * em dash.
 */
function wordParts(word: string): string[] {
  const chars = [...word];
  const out: string[] = [];
  let part = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]!;
    const next = chars[i + 1];
    if (c === "—" && part && part[part.length - 1] !== "—") {
      out.push(part);
      part = "";
    }
    part += c;
    if (next === undefined) break;
    const after =
      (c === "-" && i > 0 && !/[0-9]/.test(next)) || c === "–" || (c === "—" && next !== "—");
    if (after) {
      out.push(part);
      part = "";
    }
  }
  if (part) out.push(part);
  return out;
}

/** The lines `text` wraps into at `width`, as the DOM wraps it (`pre-wrap`, `anywhere`). */
export function wrapText(m: FarTextMetrics, font: FarFont, text: string, width: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line: string[] = [];
    // The width of `line` with its spaces, and without the spaces at its end.
    let full = 0;
    let inked = 0;
    const append = (c: string) => {
      const last = line[line.length - 1];
      full += (last === undefined ? 0 : m.kern(font, last, c)) + m.advance(font, c);
      line.push(c);
      if (c !== " ") inked = full;
    };
    const flush = () => {
      out.push(line.join("").replace(/ +$/, ""));
      line = [];
      full = inked = 0;
    };
    const tokens = paragraph.split(/( +)/).flatMap((t) => (t[0] === " " ? [t] : wordParts(t)));
    for (const token of tokens) {
      if (!token) continue;
      const cs = clusters(token);
      if (token[0] === " ") {
        for (const c of cs) append(c);
        continue;
      }
      // The word on this line, if it fits.
      const saved = { line: [...line], full, inked };
      for (const c of cs) append(c);
      if (inked <= width + 1e-6) continue;
      line = saved.line;
      full = saved.full;
      inked = saved.inked;
      if (line.length) flush();
      // On a line of its own: broken where it reaches the edge, one cluster at least a line.
      for (const c of cs) {
        const before = { full, inked };
        append(c);
        if (inked > width + 1e-6 && line.length > 1) {
          line.pop();
          full = before.full;
          inked = before.inked;
          flush();
          append(c);
        }
      }
    }
    out.push(line.join("").replace(/ +$/, ""));
  }
  return out;
}

/** `text` cut with an ellipsis so that it fits `max`, as `text-overflow: ellipsis` cuts it. */
export function ellipsize(m: FarTextMetrics, font: FarFont, text: string, max: number): string {
  if (lineWidth(m, font, text) <= max + 1e-6) return text;
  const cs = clusters(text);
  let lo = 0;
  let hi = cs.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineWidth(m, font, `${cs.slice(0, mid).join("")}…`) <= max + 1e-6) lo = mid;
    else hi = mid - 1;
  }
  return `${cs.slice(0, lo).join("")}…`;
}
