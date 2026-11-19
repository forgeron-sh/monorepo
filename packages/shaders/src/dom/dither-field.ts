import { bindChain, type Frame } from "../core/contract";
import { runCpu, toRgba } from "../core/cpu";
import { orderedCpu } from "../core/passes/ordered.cpu";
import { paletteCpu } from "../core/passes/palette.cpu";
import { DITHER_FIELD_TONES, ditherFieldPreset } from "../core/presets";
import { heatCpu } from "../core/sources/heat.cpu";
import { animateCanvas, colorCache, prefersStill, type ShaderHandle } from "./surface";

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
 * CPU, and keeps it drawn. Null without a 2D context.
 */
export function mountDitherField(
  canvas: HTMLCanvasElement,
  options: DitherFieldOptions = {},
): ShaderHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const px = options.pixel ?? 4;
  const chain = bindChain(
    ditherFieldPreset(options.tones ?? DITHER_FIELD_TONES),
    { heat: heatCpu },
    { ordered: orderedCpu, palette: paletteCpu },
  );
  const colors = colorCache(canvas);
  let image: ImageData | null = null;
  let frame: Frame | undefined;

  return animateCanvas(canvas, {
    still: prefersStill(canvas, options.still),
    fps: options.fps ?? 12,
    resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth / px));
      const h = Math.max(1, Math.round(canvas.clientHeight / px));
      canvas.width = w;
      canvas.height = h;
      image = ctx.createImageData(w, h);
      colors.reset();
    },
    draw(t) {
      if (!image) return;
      frame = runCpu(
        chain,
        image.width,
        image.height,
        { px: 1, time: t, resolve: colors.resolve },
        frame,
      );
      toRgba(frame, image.data);
      ctx.putImageData(image, 0, 0);
    },
  });
}
