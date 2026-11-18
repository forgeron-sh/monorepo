import { bayer, type RGB } from "@forgeron/blueprint";
import { animateCanvas, prefersStill, readTone, type ShaderHandle } from "./surface";

/**
 * The dither field: a slow ember heat rising from the bottom right, stirred by two waves and
 * quantised to three tones by the 8×8 Bayer matrix. The texture of the heroes of the sub-sites
 * (ui, icons, font), drawn on the CPU on a 2D canvas at one canvas pixel per cell.
 */

/** Tone indices of a frame: the background, the low tone, the high tone. */
export const FIELD_BG = 0;
export const FIELD_LOW = 1;
export const FIELD_HIGH = 2;

/** The three tones by default: background, a strong line, the ember. */
export const DITHER_FIELD_TONES = ["--bg", "--line-strong", "--accent"] as const;
const FALLBACKS = ["#0a0a0a", "#2e2e2e", "#ff4f1f"] as const;

/**
 * One frame of `w`×`h` cells at `t` seconds, as tone indices, row by row. Deterministic: the same
 * arguments give the same frame.
 */
export function ditherFieldFrame(
  w: number,
  h: number,
  t: number,
  out = new Uint8Array(w * h),
): Uint8Array {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      // Heat rising from the bottom right, stirred by two slow waves.
      const glow = Math.max(0, 1 - Math.hypot((u - 0.92) * 1.3, (v - 1.05) * 1.6));
      const wave = 0.5 + 0.5 * Math.sin(u * 9 + t * 0.6 + Math.sin(v * 5 - t * 0.4) * 1.6);
      const level = glow * 0.9 + wave * 0.18 * glow + (1 - v) * 0.04;
      const d = bayer(x, y, 8);
      out[y * w + x] = level > d + 0.45 ? FIELD_HIGH : level > d * 0.9 ? FIELD_LOW : FIELD_BG;
    }
  }
  return out;
}

export interface DitherFieldOptions {
  /** Side of one cell in CSS pixels (4 by default). */
  pixel?: number;
  /** The three tones, tokens or colours: background, low, high (`DITHER_FIELD_TONES`). */
  tones?: readonly [string, string, string];
  /** Frames a second (12 by default: the field steps). */
  fps?: number;
  /** Forces a still frame (`true`) or motion (`false`); the reader's preference otherwise. */
  still?: boolean;
}

/** Draws the dither field on `canvas` and keeps it drawn. Null without a 2D context. */
export function mountDitherField(
  canvas: HTMLCanvasElement,
  options: DitherFieldOptions = {},
): ShaderHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const px = options.pixel ?? 4;
  const names = options.tones ?? DITHER_FIELD_TONES;
  let colors: RGB[] = [];
  let image: ImageData | null = null;
  let tones = new Uint8Array(0);

  return animateCanvas(canvas, {
    still: prefersStill(canvas, options.still),
    fps: options.fps ?? 12,
    resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth / px));
      const h = Math.max(1, Math.round(canvas.clientHeight / px));
      canvas.width = w;
      canvas.height = h;
      image = ctx.createImageData(w, h);
      tones = new Uint8Array(w * h);
      colors = names.map((n, i) => readTone(canvas, n, FALLBACKS[i] ?? "#000"));
    },
    draw(t) {
      if (!image) return;
      const { width: w, height: h, data } = image;
      ditherFieldFrame(w, h, t, tones);
      for (let i = 0; i < tones.length; i++) {
        const c = colors[tones[i] ?? 0] ?? [0, 0, 0];
        data[i * 4] = c[0];
        data[i * 4 + 1] = c[1];
        data[i * 4 + 2] = c[2];
        data[i * 4 + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    },
  });
}
