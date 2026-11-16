// Pixel helpers of the lab design language: the ordered dither of the site's engine, a stable
// noise to vary shades from one square to the next, and the cells of the coverage map.

/** Ordered-dither threshold of an 8×8 Bayer matrix, in [0, 1). */
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

export function bayer8(x: number, y: number): number {
  return ((BAYER8[(y & 7) * 8 + (x & 7)] ?? 0) + 0.5) / 64;
}

/** A stable value in [0, 1) for a pair of integers and a seed. */
export function noise(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Four ember shades, darkest first, for filled squares. */
export const EMBER = ["#7a2410", "#b8360f", "#e2441a", "#ff4f1f", "#ff7a4f"] as const;
/** Shades of an empty square. */
export const ASH = ["#141414", "#171717", "#1a1a1a"] as const;

export interface CellPlan {
  readonly cols: number;
  readonly rows: number;
  /** Squares drawn: one per icon when they fit, fewer otherwise. */
  readonly cells: number;
  /** Squares filled in ember. */
  readonly filled: number;
}

/**
 * The squares of one category: as many as its icons when the rectangle holds them, filled in the
 * share of icons drawn (at least one when any is drawn, so a start never reads as nothing).
 */
export function planCells(
  w: number,
  h: number,
  cell: number,
  total: number,
  done: number,
): CellPlan {
  const cols = Math.max(1, Math.floor(w / cell));
  const rows = Math.max(1, Math.floor(h / cell));
  const cells = Math.min(total, cols * rows);
  const ratio = total === 0 ? 0 : done / total;
  const filled = done === 0 ? 0 : Math.min(cells, Math.max(1, Math.round(ratio * cells)));
  return { cols, rows, cells, filled };
}
