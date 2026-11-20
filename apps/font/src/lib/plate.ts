import { cellsPath } from "./raster";

/**
 * Geometry of the specimen drawings, in font units with y running down from the ascender, so a
 * drawing's viewBox is the font's own line: `0 0 width (ascender − descender)`. Shared by the
 * build-time plates and the glyph dialog in the browser.
 */

export interface LineMetrics {
  readonly ascender: number;
  readonly capHeight: number;
  readonly xHeight: number;
  readonly descender: number;
}

export interface Guide {
  readonly key: "accent" | "cap" | "x" | "baseline" | "descender";
  readonly label: string;
  /** Height above the baseline, in font units, as the font declares it. */
  readonly value: number;
  /** Distance from the top of the drawing, in font units. */
  readonly y: number;
}

/** The five horizontal guides of the face, top to bottom. */
export function guides(m: LineMetrics): Guide[] {
  const g = (key: Guide["key"], label: string, value: number): Guide => ({
    key,
    label,
    value,
    y: m.ascender - value,
  });
  return [
    g("accent", "Accent top", m.ascender),
    g("cap", "Cap height", m.capHeight),
    g("x", "x-height", m.xHeight),
    g("baseline", "Baseline", 0),
    g("descender", "Descender", m.descender),
  ];
}

export interface Placed {
  readonly cp: number;
  /** Left edge, in font units. */
  readonly x: number;
  readonly advance: number;
  readonly rows: readonly string[];
}

/** Sets `text` glyph after glyph by advance width; characters the font lacks are skipped. */
export function layoutText(
  text: string,
  bitmaps: Readonly<Record<number, readonly string[]>>,
  advances: Readonly<Record<number, number>>,
): { glyphs: Placed[]; width: number } {
  const glyphs: Placed[] = [];
  let x = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const rows = bitmaps[cp];
    const advance = advances[cp];
    if (!rows || advance === undefined) continue;
    glyphs.push({ cp, x, advance, rows });
    x += advance;
  }
  return { glyphs, width: x };
}

/** Grid lines every `unit` over a `width` × `height` drawing, as one SVG path. */
export function gridPath(width: number, height: number, unit: number): string {
  let d = "";
  for (let x = 0; x <= width; x += unit) d += `M${x} 0V${height}`;
  for (let y = 0; y <= height; y += unit) d += `M0 ${y}H${width}`;
  return d;
}

export interface GlyphSvgOptions {
  readonly unit: number;
  readonly advance: number;
  readonly metrics: LineMetrics;
  /** Accessible name; the drawing is decorative when absent. */
  readonly title?: string;
}

/**
 * One glyph as an SVG proof: the pixel grid over the whole advance, the guides of the face and
 * the inked cells. Colours come from CSS classes (`.g-grid`, `.g-guide`, `.g-ink`, `.g-base`).
 */
export function glyphSvg(rows: readonly string[], o: GlyphSvgOptions): string {
  const height = o.metrics.ascender - o.metrics.descender;
  // A margin on the left for the names of the guides, one cell on the right.
  const left = 500;
  const right = o.unit;
  const lines = guides(o.metrics)
    .map(
      (g) =>
        `<path class="g-guide${g.key === "baseline" ? " g-base" : ""}" d="M${-left + 20} ${g.y}H${o.advance + right}"/>` +
        `<text class="g-label" x="${-left + 20}" y="${g.y - 14}" font-size="40">${GUIDE_SHORT[g.key]} ${g.value}</text>`,
    )
    .join("");
  const label = o.title
    ? `role="img" aria-label="${o.title.replace(/"/g, "&quot;")}"`
    : `aria-hidden="true"`;
  return (
    `<svg viewBox="${-left} -60 ${o.advance + left + right} ${height + 120}" ${label}>` +
    `<path class="g-grid" d="${gridPath(o.advance, height, o.unit)}"/>` +
    `<rect class="g-adv" x="0" y="0" width="${o.advance}" height="${height}"/>` +
    lines +
    `<path class="g-ink" shape-rendering="crispEdges" d="${cellsPath(rows, o.unit)}"/>` +
    `</svg>`
  );
}

const GUIDE_SHORT: Record<Guide["key"], string> = {
  accent: "ACC",
  cap: "CAP",
  x: "X",
  baseline: "BASE",
  descender: "DESC",
};

/** Glyph bitmaps side by side: one string per row, `#` for ink. */
export function joinRows(glyphs: readonly (readonly string[])[]): string[] {
  const rows = Math.max(0, ...glyphs.map((g) => g.length));
  return Array.from({ length: rows }, (_, r) => glyphs.map((g) => g[r] ?? "").join(""));
}
