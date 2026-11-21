import { bayer } from "../bayer";

/**
 * The dither reveal: a glitch that resolves into a pixel title (the hero of the font specimen).
 * A raster scan: the pixel rows of the title start one after the other, top to bottom across all
 * lines, and each row is swept from left to right. Consecutive rows overlap, so the front is a
 * slanted edge, and an 8×8 Bayer threshold switches pixels on around it, sparse first, solid a
 * little later. Near the front each pixel is shifted by a travelling wave and painted in steps of
 * the palette (ember, dark ember, dim, muted) before it settles in ink; stray pixels flicker in a
 * halo around the letters and die out. Everything stays on whole pixels. A CPU generator; the
 * lines are rows of the pixel face (`textRows` of `@forgeron/ui`), `#` for ink.
 */

export interface RevealCell {
  readonly x: number;
  readonly y: number;
  /** When the pixel appears, in [0, 1). */
  readonly t: number;
}

/** A pixel of one frame: where it is drawn and in which colour step (0 ember … 4 ink). */
export interface Painted {
  readonly x: number;
  readonly y: number;
  readonly band: number;
}

const bayer8 = (x: number, y: number) => bayer(x, y, 8);

/** Ages (progress since a pixel's time) at which it moves to the next colour step. */
export const REVEAL_BANDS = [0.05, 0.1, 0.15, 0.2] as const;
/** How far ahead of its time a pixel may already flicker, as a stray. */
const FRONT = 0.08;
/** Progress at which every pixel has settled: the end of the animation. */
export const REVEAL_END = 1 + REVEAL_BANDS[3];
/** Share of the whole reveal that one row takes to sweep from left to right. */
const ROW_SWEEP = 0.3;
/** Share of the timing given to the dither threshold. */
const DITHER = 0.12;

/**
 * When the pixel at column `x` of the global pixel row `row` appears: its row starts after the
 * rows above it, then the sweep reaches its column; the Bayer threshold shifts it a little.
 */
function timeOf(x: number, row: number, cols: number, rows: number): number {
  const start = (Math.min(Math.max(row, 0), rows - 1) / Math.max(1, rows - 1)) * (1 - ROW_SWEEP);
  const sweep = ((Math.min(Math.max(x, 0), cols - 1) + 0.5) / cols) * ROW_SWEEP;
  const t = (start + sweep) * (1 - DITHER) + bayer8(x + 8, row + 8) * DITHER;
  return Math.min(0.999, Math.max(0, t));
}

/** Width of the widest line and the number of pixel rows of all lines together. */
export const revealExtent = (lines: readonly (readonly string[])[]) => ({
  cols: Math.max(1, ...lines.flatMap((rows) => rows.map((r) => r.length))),
  rows: lines.reduce((n, rows) => n + rows.length, 0),
  offsets: lines.map((_, i) => lines.slice(0, i).reduce((n, rows) => n + rows.length, 0)),
});

/** The inked pixels of each line with their reveal time. */
export function revealCells(lines: readonly (readonly string[])[]): RevealCell[][] {
  const { cols, rows, offsets } = revealExtent(lines);
  return lines.map((lineRows, i) => {
    const cells: RevealCell[] = [];
    lineRows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++)
        if (row[x] === "#") cells.push({ x, y, t: timeOf(x, (offsets[i] ?? 0) + y, cols, rows) });
    });
    return cells;
  });
}

/**
 * The paper pixels around the letters of each line, within `radius` of an inked one (outside the
 * bitmap too), with a time on the same sweep: where stray pixels may flicker.
 */
export function haloCells(lines: readonly (readonly string[])[], radius = 1): RevealCell[][] {
  const { cols, rows: total, offsets } = revealExtent(lines);
  return lines.map((rows, i) => {
    const ink = (x: number, y: number) => rows[y]?.[x] === "#";
    const width = Math.max(0, ...rows.map((r) => r.length));
    const cells: RevealCell[] = [];
    for (let y = -radius; y < rows.length + radius; y++) {
      for (let x = -radius; x < width + radius; x++) {
        if (ink(x, y)) continue;
        let near = false;
        for (let dy = -radius; dy <= radius && !near; dy++)
          for (let dx = -radius; dx <= radius && !near; dx++) near = ink(x + dx, y + dy);
        if (near) cells.push({ x, y, t: timeOf(x, (offsets[i] ?? 0) + y, cols, total) });
      }
    }
    return cells;
  });
}

/** The colour step of a pixel of a given age: 0 to 3 while it settles, 4 once it is ink. */
export function bandOf(age: number): number {
  const i = REVEAL_BANDS.findIndex((b) => age < b);
  return i < 0 ? REVEAL_BANDS.length : i;
}

/** Whole-pixel shift by the travelling wave: strong at the front, nothing once settled. */
function wave(age: number, x: number, y: number, p: number): [number, number] {
  const amp = age < 0 ? 2 : age < REVEAL_BANDS[3] ? 2 * (1 - age / REVEAL_BANDS[3]) : 0;
  if (amp === 0) return [0, 0];
  const dx = Math.round(amp * Math.sin(y * 1.7 + p * 41));
  const dy = Math.round(amp * 0.6 * Math.sin(x * 0.9 - p * 29));
  return [dx === 0 ? 0 : dx, dy === 0 ? 0 : dy];
}

/** The pixels of one frame at progress `p` (0 to `REVEAL_END`). At the end: the text, exactly. */
export function revealFrame(
  cells: readonly RevealCell[],
  halo: readonly RevealCell[],
  p: number,
): Painted[] {
  const out: Painted[] = [];
  for (const c of cells) {
    const age = p - c.t;
    if (age >= 0) {
      const [dx, dy] = wave(age, c.x, c.y, p);
      out.push({ x: c.x + dx, y: c.y + dy, band: bandOf(age) });
    } else if (age > -FRONT && bayer8(c.x + 3, c.y + 5) < 1 + age / FRONT) {
      // Ahead of its time: a stray, ember, shifted by the wave.
      const [dx, dy] = wave(age, c.x, c.y, p);
      out.push({ x: c.x + dx, y: c.y + dy, band: 0 });
    }
  }
  for (const c of halo) {
    const age = p - c.t;
    if (age <= -FRONT || age >= REVEAL_BANDS[1]) continue;
    // A sparse, dying halo: fewer pixels the further from the front.
    if (bayer8(c.x + 5, c.y + 2) > 0.45 * (1 - Math.abs(age) / FRONT)) continue;
    const [dx, dy] = wave(age, c.x, c.y, p);
    out.push({ x: c.x + dx, y: c.y + dy, band: age < 0 ? 0 : 1 });
  }
  return out;
}

/** Font pixels drawn around the title, for the shifted and stray pixels. */
export const REVEAL_MARGIN = 3;
