import type { RGB } from "../core/color";
import { ditherFieldPixels } from "../core/fused";
import { DITHER_FIELD_TONES, ditherFieldTones } from "../core/dither-field";
import { animateCanvas, prefersStill, resolveColor, type ShaderHandle } from "./surface";

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

/**
 * Draws the dither field (`ditherFieldPreset`) on `canvas`, one canvas pixel per cell, on the
 * CPU (its chain fused into one loop, `ditherFieldPixels`), and keeps it drawn. Null without a 2D context.
 */
export function mountDitherField(
  canvas: HTMLCanvasElement,
  options: DitherFieldOptions = {},
): ShaderHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const px = options.pixel ?? 4;
  const tones = ditherFieldTones(options.tones ?? DITHER_FIELD_TONES);
  // Read again on each resize, as `colorCache` would (a theme change takes effect then).
  let colors: RGB[] = [];
  let image: ImageData | null = null;

  return animateCanvas(canvas, {
    still: prefersStill(canvas, options.still),
    fps: options.fps ?? 12,
    resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth / px));
      const h = Math.max(1, Math.round(canvas.clientHeight / px));
      canvas.width = w;
      canvas.height = h;
      image = ctx.createImageData(w, h);
      colors = tones.map((ref) => resolveColor(canvas, ref));
    },
    draw(t) {
      if (!image) return;
      ditherFieldPixels(image.data, image.width, image.height, t, colors);
      ctx.putImageData(image, 0, 0);
    },
  });
}
