import { bayer, glyph, glyphWidth } from "@forgeron/blueprint";
import { prefersStill, readTone } from "./surface";

/**
 * The dither reveal: a glitch that resolves into a pixel title (the hero of the font specimen).
 * A raster scan: the pixel rows of the title start one after the other, top to bottom across all
 * lines, and each row is swept from left to right. Consecutive rows overlap, so the front is a
 * slanted edge, and an 8×8 Bayer threshold switches pixels on around it, sparse first, solid a
 * little later. Near the front each pixel is shifted by a travelling wave and painted in steps of
 * the palette (ember, dark ember, dim, muted) before it settles in ink; stray pixels flicker in a
 * halo around the letters and die out. Everything stays on whole pixels.
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
 * The rows of `text` in the pixel face's capitals: one string per pixel row (7), `#` for ink,
 * one column between letters.
 */
export function textRows(text: string): string[] {
  const rows = Array.from({ length: 7 }, () => "");
  const caps = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
  [...caps].forEach((ch, i) => {
    const g = glyph(ch);
    const w = glyphWidth(g);
    for (let r = 0; r < 7; r++) {
      const row = g.rows[r - g.top] ?? ".".repeat(w);
      rows[r] += (i > 0 ? "." : "") + row.padEnd(w, ".");
    }
  });
  return rows;
}

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
const extent = (lines: readonly (readonly string[])[]) => ({
  cols: Math.max(1, ...lines.flatMap((rows) => rows.map((r) => r.length))),
  rows: lines.reduce((n, rows) => n + rows.length, 0),
  offsets: lines.map((_, i) => lines.slice(0, i).reduce((n, rows) => n + rows.length, 0)),
});

/** The inked pixels of each line with their reveal time. */
export function revealCells(lines: readonly (readonly string[])[]): RevealCell[][] {
  const { cols, rows, offsets } = extent(lines);
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
  const { cols, rows: total, offsets } = extent(lines);
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

export interface RevealOptions {
  /** CSS pixels per font pixel (8 by default). */
  pixel?: number;
  /** Length of the reveal in milliseconds (1500 by default: 1.3 to 1.8 s for a hero title). */
  duration?: number;
  /** Forces the final text at once (`true`); the reader's preference otherwise. */
  still?: boolean;
  /** Called once the text has settled (or at once when still). */
  onDone?: () => void;
}

export interface RevealHandle {
  /** Plays the reveal from the start. */
  play(): void;
  destroy(): void;
}

/** The second ember of the lab palette, between the accent and the greys. */
const DARK_EMBER = "#b8360f";

/**
 * Plays the reveal of `lines` (each one string array of `textRows`) on `canvas`, stacked, with a
 * margin of `REVEAL_MARGIN` font pixels all round. The canvas is cleared at the end: the text
 * under it is the final state.
 */
export function mountReveal(
  canvas: HTMLCanvasElement,
  lines: readonly (readonly string[])[],
  options: RevealOptions = {},
): RevealHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const win = canvas.ownerDocument.defaultView;
  const cell = options.pixel ?? 8;
  const duration = options.duration ?? 1500;
  const dpr = Math.min(win?.devicePixelRatio || 1, 2);
  const size = Math.max(1, Math.round(cell * dpr));
  const ink = revealCells(lines);
  const halo = haloCells(lines);
  const { cols, offsets } = extent(lines);
  const allCells = ink.flatMap((cs, i) => cs.map((c) => ({ ...c, y: c.y + (offsets[i] ?? 0) })));
  const allHalo = halo.flatMap((cs, i) => cs.map((c) => ({ ...c, y: c.y + (offsets[i] ?? 0) })));
  const w = cols + 2 * REVEAL_MARGIN;
  const h = lines.reduce((n, rows) => n + rows.length, 0) + 2 * REVEAL_MARGIN;
  canvas.style.width = `${w * cell}px`;
  canvas.style.height = `${h * cell}px`;
  canvas.width = w * size;
  canvas.height = h * size;
  const colours = [
    readTone(canvas, "--accent", "#ff4f1f"),
    readTone(canvas, DARK_EMBER, DARK_EMBER),
    readTone(canvas, "--ink-dim", "#5e5e5e"),
    readTone(canvas, "--ink-muted", "#8f8f8f"),
    readTone(canvas, "--ink", "#ededed"),
  ].map(([r, g, b]) => `rgb(${r} ${g} ${b})`);
  let raf = 0;

  const done = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    options.onDone?.();
  };
  const play = () => {
    cancelAnimationFrame(raf);
    if (prefersStill(canvas, options.still)) return done();
    let start = -1;
    const draw = (now: number) => {
      if (start < 0) start = now;
      const p = Math.min(REVEAL_END, ((now - start) / duration) * REVEAL_END);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const px of revealFrame(allCells, allHalo, p)) {
        ctx.fillStyle = colours[px.band] ?? colours[4] ?? "#fff";
        ctx.fillRect((px.x + REVEAL_MARGIN) * size, (px.y + REVEAL_MARGIN) * size, size, size);
      }
      if (p < REVEAL_END) raf = requestAnimationFrame(draw);
      else done();
    };
    raf = requestAnimationFrame(draw);
  };
  play();
  return {
    play,
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
