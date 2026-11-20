// The glyph atlas of the GPU layer: each glyph a text draws (a font, a size, a cluster), rasterised
// by a 2D canvas with the DOM's own rasteriser, at the size it takes on screen, in four
// quarter-pixel phases, white on transparent (the shader colours it). A table, one row per 256
// glyphs, says where each one is: the shader reads it by the glyph's id, so a zoom changes the
// table, never the instances. While the zoom moves, a glyph keeps a cell within a fifth of its
// size, or gets one at the next size of a ladder (a quarter octave apart, one phase), drawn scaled;
// once the zoom rests, the exact size. A frame rasterises for a budget of a few milliseconds,
// glyphs without a cell first. The atlas starts again when it is full. Glyphs are drawn
// on a small canvas that sits (hidden) in the surface's element, so the text settings it inherits
// (`-webkit-font-smoothing`) are the DOM's and its glyphs the DOM's own, then sent to the texture.

import type { FarFont } from "../core/text";
import type { BrowserTextMetrics } from "./text-metrics";

/** Glyphs per row of the table; each takes 8 texels: 4 phases, then its bearing and size. */
export const GLYPH_ROW = 256;
const TEXELS = 8;
/** Bigger glyphs than this many device pixels are drawn at this size, scaled. */
const MAX_PX = 160;
const PHASES = 4;

interface Entry {
  /** Device pixels of the font size it was rasterised at. */
  px: number;
  phases: number;
}

export interface GlyphAtlas {
  id(font: FarFont, cluster: string): number;
  font(id: number): FarFont;
  cluster(id: number): string;
  /**
   * Rasterises, within `budget` ms, what `ids` (glyph → the lowest zoom it is drawn from) needs at
   * `scale` (device pixels per world unit): exact sizes once `settled`. True when work is left.
   */
  prepare(
    ids: ReadonlyMap<number, number>,
    zoom: number,
    scale: number,
    settled: boolean,
    budget: number,
  ): boolean;
  /** Drops every cell (a font has loaded). */
  reset(): void;
  readonly size: number;
  readonly table: Float32Array;
  /** Rows of the table in use. */
  readonly rows: number;
  /** What changed since `clean()`: the table's rows, a reset (the texture starts transparent). */
  readonly dirty: { rows: Set<number>; cleared: boolean };
  clean(): void;
  destroy(): void;
}

const ladder = (px: number) => 2 ** (Math.ceil(Math.log2(px) * 4 - 1e-6) / 4);

/**
 * Puts a glyph's cells into the texture: `w` × `h` pixels from the top-left of `source` at `x`, `y`
 * of the atlas.
 */
export type GlyphUpload = (
  x: number,
  y: number,
  w: number,
  h: number,
  source: HTMLCanvasElement,
) => void;

/** The scratch canvas a glyph's phases are drawn on before they go to the texture. */
const SCRATCH_W = 1024;
const SCRATCH_H = 256;

export function createGlyphAtlas(
  host: HTMLElement,
  metrics: BrowserTextMetrics | null,
  upload: GlyphUpload,
  size = 2048,
): GlyphAtlas {
  const doc = host.ownerDocument;
  const ids = new Map<string, number>();
  const fonts: FarFont[] = [];
  const texts: string[] = [];
  let entries: Array<Entry | undefined> = [];
  let table = new Float32Array(GLYPH_ROW * TEXELS * 4);
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  // Shelves: rows of cells, filled left to right.
  let shelfY = 0;
  let shelfH = 0;
  let shelfX = 0;
  const dirty = {
    rows: new Set<number>(),
    cleared: false,
  };

  const context = () => {
    if (ctx) return ctx;
    canvas = doc.createElement("canvas");
    canvas.width = SCRATCH_W;
    canvas.height = SCRATCH_H;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "none";
    host.append(canvas);
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    return ctx;
  };

  // The cells drawn on the scratch canvas and not yet sent: a run of one shelf, from `batchX`.
  let batchX = -1;
  let batchY = 0;
  let batchW = 0;
  let batchH = 0;
  const flush = () => {
    if (batchX >= 0 && batchW > 0 && canvas) upload(batchX, batchY, batchW, batchH, canvas);
    batchX = -1;
    batchW = batchH = 0;
  };

  const reset = () => {
    batchX = -1;
    batchW = batchH = 0;
    entries = [];
    table.fill(0);
    for (let r = 0; r < Math.ceil(fonts.length / GLYPH_ROW); r++) dirty.rows.add(r);
    shelfX = shelfY = shelfH = 0;
    dirty.cleared = true;
  };

  const place = (w: number, h: number): [number, number] | null => {
    if (shelfX + w > size) {
      shelfY += shelfH;
      shelfX = 0;
      shelfH = 0;
    }
    if (shelfY + h > size || w > size) return null;
    const at: [number, number] = [shelfX, shelfY];
    shelfX += w;
    shelfH = Math.max(shelfH, h);
    return at;
  };

  /** Rasterises glyph `id` at `px`; false when the atlas is full. */
  const raster = (id: number, px: number, phases: number): boolean => {
    const c = context();
    if (!c || !metrics) return true;
    const font = fonts[id]!;
    c.font = metrics.css(font, px);
    c.textBaseline = "alphabetic";
    c.fillStyle = "#fff";
    const t = c.measureText(texts[id]!);
    const pad = 2;
    const left = Math.ceil(Math.max(0, t.actualBoundingBoxLeft ?? 0));
    const ascent = Math.ceil(Math.max(0, t.actualBoundingBoxAscent ?? px));
    const descent = Math.ceil(Math.max(0, t.actualBoundingBoxDescent ?? 0));
    const right = Math.ceil(Math.max(t.actualBoundingBoxRight ?? t.width, 0));
    const w = left + right + pad * 2 + 1;
    const h = ascent + descent + pad * 2;
    const ox = pad + left;
    const oy = pad + ascent;
    const o = id * TEXELS * 4;
    // The phases side by side in one cell, drawn on the scratch canvas where the run of cells of
    // the shelf goes, sent with the run (`flush`).
    if (w * phases > SCRATCH_W || h > SCRATCH_H) return true;
    const at = place(w * phases, h);
    if (!at) return false;
    if (
      batchX < 0 ||
      at[1] !== batchY ||
      at[0] !== batchX + batchW ||
      batchW + w * phases > SCRATCH_W
    ) {
      flush();
      batchX = at[0];
      batchY = at[1];
      c.clearRect(0, 0, SCRATCH_W, SCRATCH_H);
    }
    const sx = at[0] - batchX;
    batchW += w * phases;
    batchH = Math.max(batchH, h);
    for (let p = 0; p < phases; p++) {
      c.fillText(texts[id]!, sx + p * w + ox + p / phases, oy);
      table[o + p * 4] = at[0] + p * w;
      table[o + p * 4 + 1] = at[1];
      table[o + p * 4 + 2] = w;
      table[o + p * 4 + 3] = h;
    }
    table[o + 16] = -ox;
    table[o + 17] = -oy;
    table[o + 18] = px;
    table[o + 19] = phases;
    entries[id] = { px, phases };
    dirty.rows.add(Math.floor(id / GLYPH_ROW));
    return true;
  };

  return {
    id(font, cluster) {
      const key = `${font.family ?? "sans"}|${font.weight ?? 400}|${font.size}|${cluster}`;
      let id = ids.get(key);
      if (id === undefined) {
        id = fonts.length;
        ids.set(key, id);
        fonts.push(font);
        texts.push(cluster);
        const need = Math.ceil(fonts.length / GLYPH_ROW) * GLYPH_ROW * TEXELS * 4;
        if (need > table.length) {
          const next = new Float32Array(need * 2);
          next.set(table);
          table = next;
        }
      }
      return id;
    },
    font: (id) => fonts[id]!,
    cluster: (id) => texts[id]!,
    prepare(needed, zoom, scale, settled, budget) {
      const start = performance.now();
      // Glyphs without a cell first (they are not drawn at all), then better sizes of the rest
      // (drawn scaled meanwhile); both within the budget, the rest in the next frames.
      const missing: Array<[number, number, number]> = [];
      const better: Array<[number, number, number]> = [];
      for (const [id, from] of needed) {
        if (zoom < from) continue;
        const want = fonts[id]!.size * scale;
        if (want < 0.5) continue;
        const exact = settled && want <= MAX_PX;
        const px = exact ? want : Math.min(MAX_PX, ladder(want));
        const phases = exact ? PHASES : 1;
        const e = entries[id];
        if (e && e.px === px && e.phases === phases) continue;
        // While the zoom moves, a cell within a fifth of the size is drawn scaled.
        if (e && !settled && e.px >= want * 0.8 && e.px <= want * 1.25) continue;
        (e ? better : missing).push([id, px, phases]);
      }
      const done: Array<[number, number, number]> = [];
      for (const job of [...missing, ...better]) {
        if (performance.now() - start > budget) {
          flush();
          return true;
        }
        if (raster(job[0], job[1], job[2])) {
          done.push(job);
          continue;
        }
        // Full: start again with what this frame has drawn so far, at the size of the moment.
        reset();
        for (const [i, p, ph] of done) raster(i, p, ph);
        raster(job[0], job[1], job[2]);
        flush();
        return true;
      }
      flush();
      return false;
    },
    reset,
    size,
    get table() {
      return table;
    },
    get rows() {
      return Math.max(1, Math.ceil(fonts.length / GLYPH_ROW));
    },
    dirty,
    destroy() {
      canvas?.remove();
    },
    clean() {
      dirty.rows.clear();
      dirty.cleared = false;
    },
  };
}
