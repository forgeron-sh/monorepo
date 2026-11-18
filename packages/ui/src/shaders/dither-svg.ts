import { bayer, type BayerSize } from "@forgeron/blueprint";

/**
 * The ordered dither at build time: a tone function over a grid becomes the path of the cells
 * drawn, one unit each (viewBox `0 0 cols rows`). A cell is drawn when its tone is above the
 * Bayer threshold of its position. Static SVG: no canvas, no JavaScript.
 */
export function ditherPath(
  cols: number,
  rows: number,
  tone: (x: number, y: number) => number,
  n: BayerSize = 8,
): string {
  const parts: string[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (tone(x, y) > bayer(x, y, n)) parts.push(`M${x} ${y}h1v1h-1z`);
  return parts.join("");
}
