import type { Frame } from "../core/contract";
import { runCpu, toRgba } from "../core/cpu";
import { hearthChain } from "../core/presets";
import {
  type CellRect,
  hearthCell,
  hearthGrid,
  type HearthGrid,
  type PixelFace,
} from "../core/sources/hearth";
import { colorCache, prefersStill, type ShaderHandle } from "./surface";

/**
 * The hearth on a page (`hearthChain`): sizes the grid to whole cells, draws only while on
 * screen and one still frame under `prefers-reduced-motion`; the canvas is upscaled with a gap on
 * each cell's right and top edges from 4 CSS pixels.
 */

const chain = hearthChain();

export interface HearthOptions {
  /** The pixel face of the wordmark (Blueprint's `glyph`, `glyphWidth`, `textWidth`). */
  face: PixelFace;
  /** The wordmark (`FORGERON` by default), drawn in capitals. */
  text?: string;
  /** Side of a cell in CSS pixels; `hearthCell(width)` by default. */
  cell?: number;
  /** Forces a still frame (`true`) or motion (`false`); the reader's preference otherwise. */
  still?: boolean;
}

/**
 * Draws the hearth on `root`'s canvas, the wordmark inside `root`'s `[data-hearth-word]` slot, and
 * keeps it drawn (about 20 frames a second while on screen), the pointer over `root` as the
 * bellows. Marks `root` with `data-live` once drawn, so a static wordmark underneath can step aside.
 */
export function mountHearth(root: HTMLElement, options: HearthOptions): ShaderHandle | null {
  const canvas = root.querySelector("canvas");
  const slotEl = root.querySelector<HTMLElement>("[data-hearth-word]");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !slotEl || !ctx) return null;
  const win = root.ownerDocument.defaultView;
  const still = prefersStill(root, options.still);
  const off = root.ownerDocument.createElement("canvas");
  const offCtx = off.getContext("2d");
  if (!offCtx) return null;

  let grid: HearthGrid | null = null;
  let cell = 4;
  let dpr = 1;
  let frame: Frame | undefined;
  const colors = colorCache(root);
  let image: ImageData | null = null;
  let bellows: { x: number; y: number } | null = null;
  let raf = 0;
  let last = -1;
  let visible = false;
  const start = performance.now();
  const now = () => (still ? 0 : (performance.now() - start) / 1000);

  const measure = () => {
    const width = root.clientWidth;
    const height = root.clientHeight;
    cell = options.cell ?? hearthCell(width);
    dpr = Math.min(win?.devicePixelRatio || 1, 2);
    const cols = Math.max(1, Math.floor(width / cell));
    const rows = Math.max(1, Math.floor(height / cell));
    const r = root.getBoundingClientRect();
    const s = slotEl.getBoundingClientRect();
    const slot: CellRect = {
      x: Math.round((s.left - r.left) / cell),
      y: Math.round((s.top - r.top) / cell),
      w: Math.floor(s.width / cell),
      h: Math.floor(s.height / cell),
    };
    grid = hearthGrid(options.face, cols, rows, slot, options.text);
    off.width = cols;
    off.height = rows;
    image = offCtx.createImageData(cols, rows);
    canvas.style.width = `${cols * cell}px`;
    canvas.style.height = `${rows * cell}px`;
    canvas.width = cols * cell * dpr;
    canvas.height = rows * cell * dpr;
    colors.reset();
  };

  const draw = (t: number) => {
    if (!grid || !image) return;
    frame = runCpu(
      chain,
      grid.cols,
      grid.rows,
      {
        px: 1,
        time: t,
        data: { grid, heat: bellows },
        resolve: colors.resolve,
      },
      frame,
    );
    toRgba(frame, image.data);
    offCtx.putImageData(image, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    // Cells of 4 CSS pixels or more leave a gap on their right and top edges, as the fields do.
    if (cell >= 4) {
      const cp = cell * dpr;
      const gap = Math.max(1, Math.round(cp * 0.16));
      for (let x = 0; x < grid.cols; x++) ctx.clearRect(x * cp + cp - gap, 0, gap, canvas.height);
      for (let y = 0; y < grid.rows; y++) ctx.clearRect(0, y * cp, canvas.width, gap);
    }
    root.dataset.live = "";
  };

  const loop = (ts: number) => {
    // About 20 frames a second: the embers step, they do not glide.
    if (last < 0 || ts - last >= 50) {
      last = ts;
      draw(now());
    }
    if (visible && !still) raf = requestAnimationFrame(loop);
  };

  const sized = new ResizeObserver(() => {
    measure();
    draw(now());
  });
  sized.observe(root);
  measure();
  draw(now());

  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    bellows = { x: (e.clientX - r.left) / cell, y: (e.clientY - r.top) / cell };
  };
  const onLeave = () => {
    bellows = null;
  };
  // A still frame stays still: no bellows.
  if (!still) {
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
  }
  const seen = new IntersectionObserver(([entry]) => {
    const on = entry?.isIntersecting ?? false;
    if (on && !visible) {
      visible = true;
      last = -1;
      if (!still) raf = requestAnimationFrame(loop);
    } else if (!on) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  });
  seen.observe(root);

  return {
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      sized.disconnect();
      seen.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    },
  };
}
