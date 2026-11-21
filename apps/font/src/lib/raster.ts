import type { Contour, FontFile, FontGlyph } from "./otf";

/**
 * Forgeron Sans is drawn on a pixel grid: every outline point and every advance is a multiple of
 * one grid unit. These helpers find that unit in the files and turn outlines back into pixels.
 */

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

/** The largest unit every coordinate and advance of the font is a multiple of, in font units. */
export function gridUnit(font: Pick<FontFile, "glyphs">): number {
  let g = 0;
  for (const glyph of font.glyphs) {
    g = gcd(g, glyph.advance);
    for (const contour of glyph.contours) for (const [x, y] of contour) g = gcd(gcd(g, x), y);
  }
  return g;
}

/** Nonzero winding number of the outlines around a point. */
export function windingAt(contours: readonly Contour[], x: number, y: number): number {
  let wind = 0;
  for (const c of contours) {
    for (let i = 0; i < c.length; i++) {
      const a = c[i];
      const b = c[(i + 1) % c.length];
      if (!a || !b) continue;
      const [x1, y1] = a;
      const [x2, y2] = b;
      if (y1 <= y) {
        if (y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0) wind++;
      } else if (y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) wind--;
    }
  }
  return wind;
}

/**
 * A glyph as rows of `#` (ink) and `.` (paper), from `top` down to `bottom` (font units), over its
 * whole advance, one character per `unit`. Each cell is sampled at its centre.
 */
export function rasterize(glyph: FontGlyph, unit: number, top: number, bottom: number): string[] {
  const cols = Math.round(glyph.advance / unit);
  const rows = Math.round((top - bottom) / unit);
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    const y = top - (r + 0.5) * unit;
    let line = "";
    for (let c = 0; c < cols; c++)
      line += windingAt(glyph.contours, (c + 0.5) * unit, y) !== 0 ? "#" : ".";
    out.push(line);
  }
  return out;
}

/** The inked spans `[from, to)` of a glyph along a horizontal line, in font units. */
export function scanRuns(glyph: FontGlyph, y: number, unit: number): [number, number][] {
  const runs: [number, number][] = [];
  let start: number | null = null;
  const cols = Math.round(glyph.advance / unit);
  for (let c = 0; c <= cols; c++) {
    const inside = c < cols && windingAt(glyph.contours, (c + 0.5) * unit, y) !== 0;
    if (inside && start === null) start = c * unit;
    if (!inside && start !== null) {
      runs.push([start, c * unit]);
      start = null;
    }
  }
  return runs;
}

/** First and last inked column and row of a bitmap, or `null` when it is blank. */
export function inkBounds(
  rows: readonly string[],
): { left: number; right: number; top: number; bottom: number } | null {
  let left = Infinity;
  let right = -1;
  let top = -1;
  let bottom = -1;
  rows.forEach((row, r) => {
    const a = row.indexOf("#");
    if (a < 0) return;
    if (top < 0) top = r;
    bottom = r;
    left = Math.min(left, a);
    right = Math.max(right, row.lastIndexOf("#"));
  });
  return top < 0 ? null : { left, right, top, bottom };
}

/**
 * Pixel bold, as `embolden` in the site's glyph table (`apps/site/src/lab/glyphs.ts`): every row
 * OR-ed with itself shifted `shift` columns right, the row growing by `shift`.
 */
export function embolden(rows: readonly string[], shift = 1): string[] {
  return rows.map((r) => {
    let out = "";
    for (let i = 0; i < r.length + shift; i++) {
      let on = false;
      for (let k = 0; k <= shift; k++) if (r[i - k] === "#") on = true;
      out += on ? "#" : ".";
    }
    return out;
  });
}

/** Each column repeated `n` times: a bitmap redrawn on a grid `n` times finer horizontally. */
export function stretchColumns(rows: readonly string[], n: number): string[] {
  return rows.map((r) => [...r].map((ch) => ch.repeat(n)).join(""));
}

/** An SVG path of the inked cells, one square per cell of size `cell`, rows merged into runs. */
export function cellsPath(rows: readonly string[], cell: number, x0 = 0, y0 = 0): string {
  let d = "";
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      if (row[c] !== "#") {
        c++;
        continue;
      }
      const start = c;
      while (row[c] === "#") c++;
      d += `M${x0 + start * cell} ${y0 + r * cell}h${(c - start) * cell}v${cell}h${-(c - start) * cell}z`;
    }
  });
  return d;
}
