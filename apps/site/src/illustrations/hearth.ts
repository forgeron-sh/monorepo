/**
 * The footer's hearth: the wordmark as iron just out of the forge, on a bed of embers. A grid of
 * square cells, each one of five tones, thresholded by an 8×8 Bayer matrix like every dithered
 * field of the site:
 *
 * - the letters are cold iron (`--ink-dim`); heat rising from the bottom turns their lower cells
 *   white (`--ink`), the hottest ember (`--accent`);
 * - around them, a dim bed of embers (`--line-strong`) and a few rising sparks in ember;
 * - the pointer is the bellows: it heats the cells around it.
 *
 * `hearthFrame` is pure (tested); `mountHearth` is the browser glue: it sizes the grid to whole
 * cells, draws only while on screen, and one still frame under `prefers-reduced-motion`.
 */
import { bayer, glyph, glyphWidth, parseColor, type RGB, textWidth } from "@forgeron/blueprint";

/** The tones of a cell, in the order `hearthFrame` numbers them (0 is the background). */
export const TONES = ["--bg", "--line-strong", "--ink-dim", "--ink", "--accent"] as const;
export const BG = 0;
export const EMBER = 1;
export const IRON = 2;
export const HOT = 3;
export const SPARK = 4;

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
 * The grid, with `text` in Forge Sans capitals as large as whole cells allow inside `slot`,
 * centred across it and standing on its bottom edge.
 */
export function hearthGrid(
  cols: number,
  rows: number,
  slot: CellRect,
  text = "FORGERON",
): HearthGrid {
  const word = new Uint8Array(Math.max(0, cols * rows));
  const tw = textWidth(text);
  const k = Math.max(1, Math.floor(Math.min(slot.w / tw, slot.h / 7)));
  const x = slot.x + Math.floor((slot.w - tw * k) / 2);
  const y = slot.y + slot.h - 7 * k;
  let cursor = 0;
  for (const ch of text) {
    const g = glyph(ch);
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
    cursor += glyphWidth(g) + 1;
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
 * One frame of tones (see `TONES`) at time `t` in seconds, with the bellows at cell `heat` when
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
export const cellSize = (width: number) => (width >= 560 ? 4 : 2);

export interface MountedHearth {
  destroy(): void;
}

/**
 * Draws the hearth on `root`'s canvas, the wordmark inside `root`'s `[data-hearth-word]` slot,
 * and keeps it drawn: resizes to whole cells, animates only while on screen (about 20 frames a
 * second), follows the pointer over `root`, draws one still frame under `prefers-reduced-motion`.
 * Marks `root` with `data-live` once drawn, so the static wordmark underneath can step aside.
 */
export function mountHearth(root: HTMLElement): MountedHearth | null {
  const canvas = root.querySelector("canvas");
  const slotEl = root.querySelector<HTMLElement>("[data-hearth-word]");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !slotEl || !ctx) return null;
  const win = root.ownerDocument.defaultView;
  const reduced = win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const off = root.ownerDocument.createElement("canvas");
  const offCtx = off.getContext("2d");
  if (!offCtx) return null;

  let grid: HearthGrid | null = null;
  let cell = 4;
  let dpr = 1;
  let colors: RGB[] = [];
  let tones = new Uint8Array(0);
  let image: ImageData | null = null;
  let bellows: { x: number; y: number } | null = null;
  let raf = 0;
  let last = -1;
  let visible = false;
  const start = performance.now();
  const now = () => (reduced ? 0 : (performance.now() - start) / 1000);

  const measure = () => {
    const width = root.clientWidth;
    const height = root.clientHeight;
    cell = cellSize(width);
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
    grid = hearthGrid(cols, rows, slot);
    tones = new Uint8Array(cols * rows);
    off.width = cols;
    off.height = rows;
    image = offCtx.createImageData(cols, rows);
    canvas.style.width = `${cols * cell}px`;
    canvas.style.height = `${rows * cell}px`;
    canvas.width = cols * cell * dpr;
    canvas.height = rows * cell * dpr;
    const style = win?.getComputedStyle(root);
    colors = TONES.map((name) => parseColor(style?.getPropertyValue(name) ?? "") ?? [0, 0, 0]);
  };

  const draw = (t: number) => {
    if (!grid || !image) return;
    hearthFrame(grid, t, bellows, tones);
    const data = image.data;
    for (let i = 0; i < tones.length; i++) {
      const tone = tones[i] ?? BG;
      const c = colors[tone] ?? [0, 0, 0];
      data[i * 4] = c[0];
      data[i * 4 + 1] = c[1];
      data[i * 4 + 2] = c[2];
      data[i * 4 + 3] = tone === BG ? 0 : 255;
    }
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
    if (visible && !reduced) raf = requestAnimationFrame(loop);
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
  // Under reduced motion the still frame stays still: no bellows.
  if (!reduced) {
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
  }
  const seen = new IntersectionObserver(([entry]) => {
    const on = entry?.isIntersecting ?? false;
    if (on && !visible) {
      visible = true;
      last = -1;
      if (!reduced) raf = requestAnimationFrame(loop);
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
