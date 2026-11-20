import type { SourceMeta } from "../contract";

/**
 * Front: a moving edge across the frame, as the value the dither reads: the source of the burns.
 * Each cell gets, in `r`, a level in `[0, 1]` for the ordered dither (0 outside the front, a thin
 * level in the outer ring, a denser one in the inner ring, 1 inside), in `g` its distance to the
 * edge in cells (negative outside) and in `b` how alive the front is (for the `sparks` pass).
 * `shape` is a rectangle that closes onto a band (`rect`) or a lobed ring that spreads from the
 * centre (`lobed`); `direction` runs it forwards or backwards (`close` burns the picture away,
 * `open` lets it in). The progress is a param, a loop (`cycle`) or, with `driven`, the input a page
 * sets while the preset runs (`uProgress`, the scroll for instance).
 */
export interface FrontParams {
  shape: "rect" | "lobed";
  direction: "close" | "open";
  /** Progress when nothing drives it, 0 to 1. */
  progress: number;
  /** Seconds of one run of the front; 0 holds `progress`. */
  cycle: number;
  /** Seconds the result stays before the next run. */
  hold: number;
  /** Read the progress from the page's input instead (`mountPreset`'s `set`). */
  driven: boolean;
  /** Width of one ring of the fringe, in cells (rings are 16 px in the site's 4 px cells). */
  ring: number;
  /** `rect`: where the frame closes onto, as shares of the frame (a band across by default). */
  left: number;
  top: number;
  right: number;
  bottom: number;
  /**
   * What lies outside the edge: the `page` colour (a canvas laid over a picture hides it) or
   * nothing (`keep`: the page clips the picture itself and the canvas only draws the fringe).
   */
  outside: "page" | "keep";
  /** `lobed`: cells the ring gains from the centre to the corners (3: 12 px more in 4 px cells). */
  grow: number;
  /** `lobed`: how far the lobes push the edge, as a share of the radius. */
  amp: number;
}

export const frontMeta: SourceMeta = {
  type: "front",
  description: "A moving edge (rectangle or lobed ring) as the level the dither reads.",
  params: {
    shape: {
      type: "enum",
      values: ["rect", "lobed"],
      default: "rect",
      description: "A rectangle closing onto a band, or a lobed ring from the centre.",
    },
    direction: {
      type: "enum",
      values: ["close", "open"],
      default: "close",
      description: "Burn the picture away, or let it in.",
    },
    progress: { type: "number", default: 0.5, min: 0, max: 1, description: "Progress, 0 to 1." },
    cycle: {
      type: "number",
      default: 0,
      min: 0,
      max: 120,
      description: "Seconds per run; 0 holds the progress.",
    },
    hold: { type: "number", default: 0.9, min: 0, max: 60, description: "Seconds held." },
    driven: {
      type: "boolean",
      default: false,
      description: "Progress comes from the page (the input set while it runs).",
    },
    ring: { type: "number", default: 4, min: 1, max: 16, description: "Cells per ring." },
    left: { type: "number", default: 0, min: 0, max: 1, description: "Closes onto: left (rect)." },
    top: { type: "number", default: 0.33, min: 0, max: 1, description: "Closes onto: top (rect)." },
    right: {
      type: "number",
      default: 1,
      min: 0,
      max: 1,
      description: "Closes onto: right (rect).",
    },
    bottom: {
      type: "number",
      default: 0.67,
      min: 0,
      max: 1,
      description: "Closes onto: bottom (rect).",
    },
    outside: {
      type: "enum",
      values: ["page", "keep"],
      default: "page",
      description: "Cover what lies outside the edge, or leave it to the page.",
    },
    grow: {
      type: "number",
      default: 3,
      min: 0,
      max: 16,
      description: "Ring growth, cells (lobed).",
    },
    amp: { type: "number", default: 0.18, min: 0, max: 0.5, description: "Lobe depth (lobed)." },
  },
};

/** The lobes' phases (fixed, so the page's clip and the canvas's fringe agree). */
export const LOBES = [1.3, 4.1, 2.7, 5.9] as const;

/**
 * How far ahead (+1) or behind (−1) the lobed front is at angle `th`, `time` seconds in: the same
 * sines the GLSL carries, for a page that clips its picture along the front.
 */
export function lobeAt(th: number, time: number): number {
  return (
    (Math.sin(th * 3 + LOBES[0] + time * 0.4) * 0.55 +
      Math.sin(th * 5 + LOBES[1] - time * 0.7) * 0.3 +
      Math.sin(th * 9 + LOBES[2] + time * 1.0) * 0.2 +
      Math.sin(th * 17 + LOBES[3]) * 0.1) /
    1.15
  );
}
