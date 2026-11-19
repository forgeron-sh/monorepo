import { bayer } from "../bayer";
import type { ColorRef, RGB } from "../color";
import type { PassMeta } from "../contract";

/**
 * Dithered images: a picture redrawn in the palette with a 4×4 ordered dither, greys for the
 * structure, ember for what glows (Blueprint's `ditherImage`, now here).
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
 * The tone of one pixel: a grey index `0..last`, or `last + 1` for ember. Luminance (times
 * `gain`) picks between two neighbouring greys through the Bayer threshold; a warm pixel (red
 * well above green and blue) is ember over the background, denser where it is brighter.
 */
export function imageTone(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number,
  last: number,
  gain: number,
): number {
  const lum = Math.min(1, ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * gain);
  const t = bayer(x, y, 4);
  const warm = r > 110 && r - b > 70 && r - g > 30;
  if (warm) return Math.min(1, (r / 255) * 1.15) > t ? last + 1 : 0;
  const v = lum * last;
  const lo = Math.floor(v);
  return v - lo > t ? Math.min(last, lo + 1) : lo;
}

/** Redraws `rgba` (row by row, `width` pixels wide) in place in the palette; every pixel opaque. */
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
      const k = imageTone(rgba[o] ?? 0, rgba[o + 1] ?? 0, rgba[o + 2] ?? 0, x, y, last, gain);
      const c = k > last ? ember : greys[k];
      rgba[o] = c?.[0] ?? 0;
      rgba[o + 1] = c?.[1] ?? 0;
      rgba[o + 2] = c?.[2] ?? 0;
      rgba[o + 3] = 255;
    }
  }
}

export interface ImageDitherParams {
  /** Luminance gain before dithering. */
  gain: number;
  /** How many greys the palette has (ember is the tone after them). */
  greys: number;
}

/** Colours (bytes over 255) to tone indices: the greys, then ember. Float luminance. */
export const imageDitherMeta: PassMeta = {
  type: "image-dither",
  kind: "cell",
  usesCell: true,
  description: "A picture to grey and ember tone indices, through the 4×4 Bayer matrix.",
  params: {
    gain: { type: "number", default: 1.1, min: 0, description: "Luminance gain." },
    greys: {
      type: "number",
      default: 5,
      min: 2,
      integer: true,
      description: "Greys in the palette; ember is the tone after them.",
    },
  },
};
