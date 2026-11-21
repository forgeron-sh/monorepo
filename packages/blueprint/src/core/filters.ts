import type { ColorRef } from "@forgeron/shaders";
import type { BayerSize } from "./bayer";
import { BlueprintError } from "./blocks";
import type { SlotName } from "./frame";

/** A colour: a literal CSS colour, or a CSS variable with its fallback (`@forgeron/shaders`). */
export type { ColorRef };

export interface PixelateFilter {
  type: "pixelate";
  /** Side of one raster pixel, in CSS pixels (a whole number, 1 or more). */
  size: number;
}
export interface DitherFilter {
  type: "dither";
  /** Side of the Bayer matrix, 4 by default. */
  matrix?: BayerSize;
}
export interface GlowFilter {
  type: "glow";
  /** Reach of the halo around accent and signal pixels, in raster pixels (1 by default). */
  radius?: number;
  /** Density of the halo next to its source, 0 to 1 (0.35 by default). */
  density?: number;
}
export interface PaletteFilter {
  type: "palette";
  /** Overrides of the default colours, by slot. */
  colors?: Partial<Record<SlotName, ColorRef>>;
}
export interface GridFilter {
  type: "grid";
  /** Share of each pixel cell left empty on its right and bottom sides (0.16 by default). */
  gap?: number;
}

/** A filter is data: `JSON.stringify` keeps it whole. */
export type Filter = PixelateFilter | DitherFilter | GlowFilter | PaletteFilter | GridFilter;

export const pixelate = (size: number): PixelateFilter => ({ type: "pixelate", size });
export const dither = (options: Omit<DitherFilter, "type"> = {}): DitherFilter => ({
  type: "dither",
  ...options,
});
export const glow = (options: Omit<GlowFilter, "type"> = {}): GlowFilter => ({
  type: "glow",
  ...options,
});
export const palette = (colors: PaletteFilter["colors"] = {}): PaletteFilter => ({
  type: "palette",
  colors,
});
export const grid = (options: Omit<GridFilter, "type"> = {}): GridFilter => ({
  type: "grid",
  ...options,
});

/** The default colours: the site's tokens, with the values of its dark theme as fallbacks. */
export const DEFAULT_PALETTE: Readonly<Record<SlotName, ColorRef>> = {
  bg: { var: "--bg", fallback: "#0a0a0a" },
  ink: { var: "--ink", fallback: "#ededed" },
  dim: { var: "--ink-dim", fallback: "#6b6b6b" },
  faint: { var: "--line-strong", fallback: "#2e2e2e" },
  accent: { var: "--accent", fallback: "#ff4f1f" },
  signal: { var: "--accent", fallback: "#ff4f1f" },
  alert: { var: "--danger", fallback: "#ff6b81" },
};

/** A validated chain, split by stage. */
export interface Plan {
  /** Raster pixel size in CSS pixels: the hoisted `pixelate`. */
  pixel: number;
  /** Bayer size when faces are dithered; null shades them flat. */
  dither: BayerSize | null;
  glow: { radius: number; density: number } | null;
  colors: Readonly<Record<SlotName, ColorRef>>;
  /** Gap of the pixel grid, or 0 without one. */
  gap: number;
}

const STAGE: Record<Filter["type"], number> = {
  pixelate: 0,
  dither: 1,
  glow: 2,
  palette: 3,
  grid: 4,
};

/**
 * Validates a chain and turns it into a plan. Filters run by stage: pixelate (it sets the raster
 * resolution, the scene is never resampled), dither, glow, palette, grid. Each appears once at
 * most, in that order.
 */
export function plan(filters: readonly Filter[] = []): Plan {
  const out: Plan = { pixel: 1, dither: null, glow: null, colors: DEFAULT_PALETTE, gap: 0 };
  let last = -1;
  const seen = new Set<string>();
  for (const f of filters) {
    const stage = STAGE[f.type];
    if (stage === undefined)
      throw new BlueprintError(`Unknown filter "${(f as { type: string }).type}".`);
    if (seen.has(f.type))
      throw new BlueprintError(`The filter "${f.type}" appears twice in the chain.`);
    if (stage < last)
      throw new BlueprintError(
        `The filter "${f.type}" comes too late: the order is pixelate, dither, glow, palette, grid.`,
      );
    seen.add(f.type);
    last = stage;
    switch (f.type) {
      case "pixelate":
        if (!Number.isInteger(f.size) || f.size < 1)
          throw new BlueprintError(
            `pixelate: the size must be a whole number of 1 or more, not ${f.size}.`,
          );
        out.pixel = f.size;
        break;
      case "dither": {
        const m = f.matrix ?? 4;
        if (m !== 2 && m !== 4 && m !== 8)
          throw new BlueprintError(`dither: the matrix is 2, 4 or 8, not ${m}.`);
        out.dither = m;
        break;
      }
      case "glow":
        out.glow = {
          radius: Math.max(1, Math.round(f.radius ?? 1)),
          density: Math.min(1, Math.max(0, f.density ?? 0.35)),
        };
        break;
      case "palette":
        out.colors = { ...DEFAULT_PALETTE, ...f.colors };
        break;
      case "grid":
        out.gap = Math.min(0.5, Math.max(0, f.gap ?? 0.16));
        break;
    }
  }
  return out;
}
