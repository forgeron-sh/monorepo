import { bayer } from "./bayer";
import type { RGB } from "./color";
import { DITHER_FIELD_STEPS } from "./dither-field";
import { heatLevel } from "./sources/heat";

/**
 * The CPU chains of the live mounts of fixed shape, fused into one loop each (docs/shaders/design.md,
 * S2c notes): the same bytes as `runCpu` of their preset then `toRgba` (a test compares them),
 * without frames of four float64 channels per cell, the pass definitions or `bindChain`. Colours
 * have whole channels (as `parseColor` and `resolveColor` give them): `toRgba` takes a channel
 * through `c / 255` and back by `Math.round(x × 255)`, which gives `c` again, so the loops write it.
 */

/**
 * One frame of `ditherFieldPreset` (the heat, the 8×8 Bayer matrix centred from the top with
 * `DITHER_FIELD_STEPS`, the palette `colors`, opaque) into `out`, `w × h` cells, at `t` seconds.
 */
export function ditherFieldPixels(
  out: Uint8ClampedArray,
  w: number,
  h: number,
  t: number,
  colors: readonly RGB[],
): void {
  const last = colors.length - 1;
  const steps = DITHER_FIELD_STEPS;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = heatLevel(x / w, y / h, t);
      const b = bayer(x, y, 8);
      let k = 0;
      while (k < steps.length) {
        const [off, scale] = steps[k] ?? [0, 1];
        if (!(v > off + b * scale)) break;
        k++;
      }
      const c = colors[Math.min(last, k)] ?? [0, 0, 0];
      const o = (y * w + x) * 4;
      out[o] = c[0];
      out[o + 1] = c[1];
      out[o + 2] = c[2];
      out[o + 3] = 255;
    }
  }
}

/**
 * Tone indices (`hearthFrame`) through `hearthPreset`'s palette into `out`: `colors[tone]`,
 * transparent for tone 0 (the background).
 */
export function hearthPixels(
  out: Uint8ClampedArray,
  tones: Uint8Array,
  colors: readonly RGB[],
): void {
  const last = colors.length - 1;
  for (let i = 0; i < tones.length; i++) {
    const k = Math.min(last, tones[i] ?? 0);
    const c = colors[k] ?? [0, 0, 0];
    const o = i * 4;
    out[o] = c[0];
    out[o + 1] = c[1];
    out[o + 2] = c[2];
    out[o + 3] = k === 0 ? 0 : 255;
  }
}
