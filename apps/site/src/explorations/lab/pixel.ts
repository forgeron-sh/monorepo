import { bayer, textSvg } from "@forgeron/blueprint";

/**
 * Pixel-art builders for the "lab" design system, run at build time: the anvil sampled on a grid,
 * and Forge Sans (the bitmap face, from @forgeron/blueprint) for the wordmark, titles and indices.
 * Everything returns static SVG markup, so the brand renders without JavaScript.
 */

/** Ordered-dither threshold of the 8×8 Bayer matrix, in [0, 1). */
export const bayer8 = (x: number, y: number): number => bayer(x, y, 8);

/**
 * The anvil of the logo (viewBox 132): a square with a half-disc bite on the left
 * and a teardrop cut-out towards the top-right corner.
 */
function insideAnvil(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x > 132 || y > 132) return false;
  if (x * x + (y - 67) ** 2 < 33 * 33) return false;
  if (y < 100) {
    let edge: number;
    if (y <= 50.494) edge = 132 - y;
    else edge = 102 - Math.sqrt(Math.max(0, 29 * 29 - (y - 71) ** 2));
    if (x > edge) return false;
  }
  return true;
}

/** Share of a grid cell covered by the anvil, sampled 4×4. */
function coverage(cx: number, cy: number, cell: number): number {
  let hits = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (insideAnvil(cx * cell + ((i + 0.5) * cell) / 4, cy * cell + ((j + 0.5) * cell) / 4))
        hits++;
    }
  }
  return hits / 16;
}

export type LogoMode = "solid" | "dither" | "fade";

/**
 * The anvil on an `n`×`n` grid. `solid`: plain pixels; `dither`: the body in an ordered dither
 * with a solid outline; `fade`: solid on the left, dissolving to the right.
 */
export function pixelLogo(n: number, mode: LogoMode = "solid"): string {
  const cell = 132 / n;
  const on: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) row.push(coverage(x, y, cell) >= 0.5);
    on.push(row);
  }
  const at = (x: number, y: number) => on[y]?.[x] ?? false;
  const cells: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!at(x, y)) continue;
      if (mode === "dither") {
        const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
        const density = 0.25 + 0.5 * (y / n);
        if (!edge && bayer8(x, y) > density) continue;
      }
      if (mode === "fade") {
        const density = 1.15 - (x / n) * 0.95;
        if (bayer8(x, y) > density) continue;
      }
      cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return `<svg viewBox="0 0 ${n} ${n}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="${cells.join("")}"/></svg>`;
}

/** `text` in Forge Sans as SVG: square pixels, one unit each, one column between letters. */
export const pixelText = textSvg;
