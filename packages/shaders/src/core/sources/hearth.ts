import { bayer } from "../bayer";
import type { SourceMeta } from "../contract";

/**
 * The hearth: a wordmark as iron just out of the forge, on a bed of embers (the footer of
 * forgeron.sh). A grid of square cells, each one of five tones, thresholded by the 8×8 Bayer
 * matrix: the letters are cold iron and turn white hot, then ember, towards their foot; around
 * them a dim bed of embers and a few rising sparks; the pointer is the bellows. A CPU generator:
 * it writes tone indices, the `palette` pass colours them.
 */

/** The tones of a cell, in the order `hearthFrame` numbers them (0 is the background). */
export const HEARTH_TONES = ["--bg", "--line-strong", "--ink-dim", "--ink", "--accent"] as const;
const BG = 0;
const EMBER = 1;
const IRON = 2;
const HOT = 3;
const SPARK = 4;

/** The pixel face the wordmark is set in (Blueprint's `glyph`, `glyphWidth`, `textWidth`). */
export interface PixelFace {
  glyph(ch: string): { rows: readonly string[]; top: number };
  glyphWidth(g: { rows: readonly string[]; top: number }): number;
  textWidth(text: string): number;
}

export interface HearthGrid {
  cols: number;
  rows: number;
  /** Cells of the wordmark, 1 inside a letter. */
  word: Uint8Array;
  /** Cells per pixel of the face, and the wordmark's top-left cell. */
  k: number;
  x: number;
  y: number;
}

/** A rectangle in cells. */
export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The grid, with `text` in the face's capitals as large as whole cells allow inside `slot`,
 * centred across it and standing on its bottom edge.
 */
export function hearthGrid(
  face: PixelFace,
  cols: number,
  rows: number,
  slot: CellRect,
  text = "FORGERON",
): HearthGrid {
  const word = new Uint8Array(Math.max(0, cols * rows));
  const caps = text.toUpperCase();
  const tw = face.textWidth(caps);
  const k = Math.max(1, Math.floor(Math.min(slot.w / tw, slot.h / 7)));
  const x = slot.x + Math.floor((slot.w - tw * k) / 2);
  const y = slot.y + slot.h - 7 * k;
  let cursor = 0;
  for (const ch of caps) {
    const g = face.glyph(ch);
    g.rows.forEach((row, r) => {
      [...row].forEach((px, c) => {
        if (px !== "#") return;
        for (let dy = 0; dy < k; dy++)
          for (let dx = 0; dx < k; dx++) {
            const cx = x + (cursor + c) * k + dx;
            const cy = y + (g.top + r) * k + dy;
            if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) word[cy * cols + cx] = 1;
          }
      });
    });
    cursor += face.glyphWidth(g) + 1;
  }
  return { cols, rows, word, k, x, y };
}

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const fbm = (x: number, y: number) =>
  noise(x, y) * 0.55 +
  noise(x * 2.03 + 1.7, y * 2.03 + 9.2) * 0.3 +
  noise(x * 4.1 + 5.3, y * 4.1 + 2.8) * 0.15;

/**
 * One frame of tones (see `HEARTH_TONES`) at `t` seconds, with the bellows at cell `heat` when
 * given. Deterministic: the same arguments give the same frame.
 */
export function hearthFrame(
  grid: HearthGrid,
  t: number,
  heat: { x: number; y: number } | null = null,
  out = new Uint8Array(grid.cols * grid.rows),
): Uint8Array {
  const { cols, rows, word } = grid;
  // Noise features are about a letter's stroke wide whatever the cell size, and rise with time.
  const scale = 1 / Math.max(3, grid.k * 2.2);
  const rise = t * 2.2;
  const sigma2 = 2 * Math.max(6, grid.k * 3) ** 2;
  // Heights are counted in wordmark heights, so the picture keeps its balance at every size.
  const wordH = 7 * grid.k;
  for (let y = 0; y < rows; y++) {
    // Inside the letters: cold on top, hot at the foot. Outside: embers up to one word high.
    const down = Math.min(1, Math.max(0, (y + 0.5 - grid.y) / wordH));
    const glow = (0.15 + 0.75 * down) ** 1.3;
    const bed = Math.max(0, 1 - (rows - y - 0.5) / wordH) ** 1.5;
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const n = fbm(x * scale, y * scale + rise);
      let bellows = 0;
      if (heat) {
        const dx = x - heat.x;
        const dy = y - heat.y;
        bellows = Math.exp(-(dx * dx + dy * dy) / sigma2);
      }
      const b = bayer(x, y, 8);
      if (word[i]) {
        const v = n * glow * 2.1 - 0.12 + bellows * n * 1.2;
        out[i] = v > b ? (v > 0.72 + b * 0.2 ? SPARK : HOT) : IRON;
      } else {
        const v = n * bed * 1.4 - 0.12 + bellows * n * 0.5;
        out[i] = v > b ? EMBER : BG;
      }
    }
  }
  // Sparks: one cell each, rising from the bed and going out before the top, outside the letters.
  const sparks = Math.max(6, Math.round(cols / 10));
  for (let s = 0; s < sparks; s++) {
    const speed = 0.06 + hash(s, 1) * 0.1;
    const life = (t * speed + hash(s, 2)) % 1;
    if (life > 0.75) continue;
    const x = Math.floor(hash(s, 3) * cols + Math.sin(life * 6 + s) * 2);
    const y = Math.floor(rows - 1 - life * rows);
    if (x < 0 || x >= cols || y < 0) continue;
    const i = y * cols + x;
    if (!word[i]) out[i] = SPARK;
  }
  return out;
}

/** Cell size in CSS pixels for a hearth `width` pixels wide: 4, or 2 on narrow screens. */
export const hearthCell = (width: number) => (width >= 560 ? 4 : 2);

/**
 * The hearth as a source: `data.grid` (a `HearthGrid` the size of the frame) and `data.heat`
 * (the bellows, in cells, or null) at `time`.
 */
export const hearthMeta: SourceMeta = {
  type: "hearth",
  description: "The footer's hearth: a wordmark of iron on a bed of embers (tone indices, CPU).",
  params: {},
};
