import {
  haloCells,
  REVEAL_END,
  REVEAL_MARGIN,
  revealCells,
  revealExtent,
  revealFrame,
} from "../core/sources/reveal";
import { prefersStill, readTone } from "./surface";

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
  const { cols, offsets } = revealExtent(lines);
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
