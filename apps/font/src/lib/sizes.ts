/**
 * Pixel-perfect sizes. One font pixel is `unit / unitsPerEm` em; at a font size of `size` CSS
 * pixels it measures `size × unit / unitsPerEm` CSS pixels. When that is a whole number every edge
 * of the outline falls on a pixel boundary and the text renders with no blur; otherwise edges land
 * between screen pixels and the rasteriser smooths them.
 */

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** The smallest font size, in CSS px, at which one font pixel is a whole number of CSS px. */
export function pixelStep(unitsPerEm: number, unit: number): number {
  return unitsPerEm / gcd(unitsPerEm, unit);
}

/** Size of one font pixel, in CSS px, at a font size. */
export function pixelScale(size: number, unitsPerEm: number, unit: number): number {
  return (size * unit) / unitsPerEm;
}

/**
 * Whether one font pixel covers a whole number of device pixels at this size: CSS px when
 * `devicePixelRatio` is 1, screen pixels otherwise.
 */
export function isPixelPerfect(
  size: number,
  unitsPerEm: number,
  unit: number,
  devicePixelRatio = 1,
): boolean {
  const px = pixelScale(size, unitsPerEm, unit) * devicePixelRatio;
  return px >= 1 && Math.abs(px - Math.round(px)) < 1e-6;
}

/** The pixel-perfect sizes (whole CSS px per font pixel) between two bounds, inclusive. */
export function pixelPerfectSizes(step: number, min: number, max: number): number[] {
  const out: number[] = [];
  for (let s = Math.ceil(min / step) * step; s <= max; s += step) if (s > 0) out.push(s);
  return out;
}

/** The pixel-perfect size closest to `size` (the larger one on a tie), never below one step. */
export function snapSize(size: number, step: number): number {
  return Math.max(step, Math.round(size / step) * step);
}
