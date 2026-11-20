// Text sizes and lines: how a text wraps at a width, for the auto growing sticky note, the text
// item, the GPU's words and the export. In a browser the editor gives the metrics of the font the
// DOM uses (`setTextMetrics`), and the layout of `@forgeron/canvas` wraps as the DOM does: that
// layout is the source of truth, for the words drawn, the heights and the export alike. Without
// metrics (tests, an export on a server) an estimate stands in, by a constant advance.

import {
  ellipsize,
  lineWidth,
  wrapText,
  type FarFont,
  type FarTextMetrics,
} from "@forgeron/canvas";

/** The advance of an average character, as a share of the font size (Geist at text sizes). */
const CHAR_ADVANCE = 0.56;
/** Line height as a share of the font size. */
export const LINE_HEIGHT = 1.4;

let metrics: FarTextMetrics | null = null;

/** The metrics texts are laid out with from now on (`null`: the estimate). */
export function setTextMetrics(m: FarTextMetrics | null): void {
  metrics = m;
  layouts.clear();
  widths.clear();
}

// Layouts by text, width and font: a moved item (a drag of the whole board) wraps nothing again.
// Dropped when the metrics change (a font has loaded) and when it grows past a bound.
const layouts = new Map<string, string[]>();
const widths = new Map<string, number>();
let layoutVersion: number | undefined;
const LAYOUTS = 8192;

const fontOf = (size: number, family: FarFont["family"] = "sans"): FarFont => ({ family, size });

/** The lines a text wraps into at `width`: by the metrics in use, or the estimate. */
export function layoutLines(
  text: string,
  width: number,
  size: number,
  family?: FarFont["family"],
): string[] {
  if (!metrics) return wrapLines(text, width, size);
  fresh(metrics);
  const key = `${family ?? "sans"}|${size}|${width}|${text}`;
  let lines = layouts.get(key);
  if (!lines) {
    if (layouts.size >= LAYOUTS) layouts.clear();
    lines = wrapText(metrics, fontOf(size, family), text, width);
    layouts.set(key, lines);
  }
  return lines;
}

/** The width of one line of text at `size`. */
export function measureLine(text: string, size: number, family?: FarFont["family"]): number {
  if (!metrics) return text.length * size * CHAR_ADVANCE;
  fresh(metrics);
  const key = `${family ?? "sans"}|${size}|${text}`;
  let w = widths.get(key);
  if (w === undefined) {
    if (widths.size >= LAYOUTS) widths.clear();
    w = lineWidth(metrics, fontOf(size, family), text);
    widths.set(key, w);
  }
  return w;
}

/** Drops the layouts made with metrics that have changed since (a font has loaded). */
function fresh(m: FarTextMetrics) {
  const version = (m as { version?: number }).version;
  if (version !== layoutVersion) {
    layouts.clear();
    widths.clear();
    layoutVersion = version;
  }
}

/** One line cut with an ellipsis to fit `max`, as `text-overflow: ellipsis` (estimate: whole). */
export function fitLine(
  text: string,
  size: number,
  max: number,
  family?: FarFont["family"],
): string {
  return metrics ? ellipsize(metrics, fontOf(size, family), text, max) : text;
}

/** Where the baseline of a line sits in its line box, from its top. */
export function baselineIn(size: number, lineHeight: number, family?: FarFont["family"]): number {
  return metrics ? metrics.baseline(fontOf(size, family), lineHeight) : size * 1.05;
}

/** The lines a text wraps into at `width` by the estimate, breaking a word longer than a line. */
export function wrapLines(text: string, width: number, size: number): string[] {
  const perLine = Math.max(1, Math.floor(width / (size * CHAR_ADVANCE)));
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > perLine) {
        if (line) {
          out.push(line);
          line = "";
        }
        out.push(w.slice(0, perLine));
        w = w.slice(perLine);
      }
      const next = line ? `${line} ${w}` : w;
      if (next.length > perLine) {
        out.push(line);
        line = w;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

/** The height a text takes at `width`, with `padding` above and below. */
export function textHeight(text: string, width: number, size: number, padding = 0): number {
  const lines = Math.max(1, layoutLines(text, width - padding * 2, size).length);
  return Math.ceil(lines * size * LINE_HEIGHT + padding * 2);
}

/** The width of the longest line of a text that does not wrap. */
export function textWidth(text: string, size: number): number {
  if (metrics) {
    const m = metrics;
    return Math.ceil(Math.max(1, ...text.split("\n").map((l) => lineWidth(m, fontOf(size), l))));
  }
  const longest = Math.max(1, ...text.split("\n").map((l) => l.length));
  return Math.ceil(longest * size * CHAR_ADVANCE);
}

/**
 * Under this zoom the board is seen from far: words are too small to read, the DOM shows none and
 * the GPU draws a wash where a text is.
 */
export const FAR_ZOOM = 0.35;

/** World units around the text of a sticky note. */
export const STICKY_PADDING = 12;
/** The font size of a sticky note's text. */
export const STICKY_TEXT = 14;

/** The height of a sticky note: as tall as its text needs, never shorter than it is square. */
export function stickyHeight(text: string, width: number, minHeight = width): number {
  return Math.max(minHeight, textHeight(text, width, STICKY_TEXT, STICKY_PADDING));
}
