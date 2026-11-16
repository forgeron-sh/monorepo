import { bayer } from "./bayer";
import type { ColorRef } from "./filters";
import type { RGB } from "./palette";

/**
 * Dithered images: a picture redrawn in the palette with a 4×4 ordered dither, four greys and the
 * background for the structure, ember for what glows. Whatever made the picture, it comes out in
 * the system. The browser glue (load, cover crop, resize) is `mountImage` in `/dom`.
 */

export interface ImagePalette<C = ColorRef> {
  /** From darkest to lightest; the first one is the background. */
  greys: readonly C[];
  /** Warm pixels, dithered over the first grey. */
  ember: C;
}

/** The site's tokens, with the values of its dark theme as fallbacks. */
export const IMAGE_PALETTE: ImagePalette = {
  greys: [
    { var: "--bg", fallback: "#0a0a0a" },
    { var: "--line-strong", fallback: "#2e2e2e" },
    { var: "--ink-dim", fallback: "#5e5e5e" },
    { var: "--ink-muted", fallback: "#8f8f8f" },
    { var: "--ink", fallback: "#ededed" },
  ],
  ember: { var: "--accent", fallback: "#ff4f1f" },
};

/**
 * Redraws `rgba` (row by row, `width` pixels wide) in place: luminance (times `gain`) picks
 * between two neighbouring greys through the Bayer threshold; a warm pixel (red well above green
 * and blue) is ember over the background, denser where it is brighter. Every pixel ends opaque.
 */
export function ditherImage(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  colors: ImagePalette<RGB>,
  gain = 1.1,
): void {
  const { greys, ember } = colors;
  const last = greys.length - 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = rgba[o] ?? 0;
      const g = rgba[o + 1] ?? 0;
      const b = rgba[o + 2] ?? 0;
      const lum = Math.min(1, ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * gain);
      const t = bayer(x, y, 4);
      const warm = r > 110 && r - b > 70 && r - g > 30;
      let c: RGB | undefined;
      if (warm) c = Math.min(1, (r / 255) * 1.15) > t ? ember : greys[0];
      else {
        const v = lum * last;
        const lo = Math.floor(v);
        c = v - lo > t ? greys[Math.min(last, lo + 1)] : greys[lo];
      }
      rgba[o] = c?.[0] ?? 0;
      rgba[o + 1] = c?.[1] ?? 0;
      rgba[o + 2] = c?.[2] ?? 0;
      rgba[o + 3] = 255;
    }
  }
}
