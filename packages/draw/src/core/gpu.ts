// The GPU drawing of the board, shared by the kinds: what `paint` draws, as canvas primitives at
// every zoom (`KindSpec.gpu`; `gpuPrimitives` in `far.ts` asks the kind). Dither patterns as bits, dashes as lengths, and the clip that cuts
// the words the DOM shows over the drawing where an opaque box lies above them.

import type { Bounds, FarDash, FarShape } from "@forgeron/canvas";
import { colorCss, DRAW_PATTERNS, PATTERN_PIXEL } from "./palette";
import type { DrawDash, DrawFill, DrawStroke } from "./types";

/** A pattern's 4 × 4 map as bits, `row * 4 + column` lit; 0 for an unknown pattern. */
export function patternBits(id: string): number {
  const rows = DRAW_PATTERNS[id] ?? [];
  let bits = 0;
  rows.forEach((row, y) => [...row].forEach((c, x) => c === "1" && (bits |= 1 << (y * 4 + x))));
  return bits;
}

/** A dash as `[on, off]` world units: what `dashArray` writes in the SVG. */
export function dashLengths(dash: DrawDash, width: number): FarDash | undefined {
  const w = Math.max(1, width);
  if (dash === "dashed") return [w * 4, w * 3];
  if (dash === "dotted") return [w, w * 2];
  return undefined;
}

/** A fill as the fields of a GPU shape: its colour, its opacity, its pattern. */
export function gpuFill(fill: DrawFill): Partial<FarShape> {
  if (fill.type === "none") return {};
  return {
    fill: colorCss(fill.color),
    ...((fill.opacity ?? 1) < 1 ? { opacity: fill.opacity } : {}),
    ...(fill.type === "pattern"
      ? { pattern: patternBits(fill.pattern), patternPixel: PATTERN_PIXEL }
      : {}),
  };
}

/** A stroke as the fields of a GPU shape: drawn inside the box, as `paint` insets it. */
export function gpuStroke(s: DrawStroke): Partial<FarShape> {
  if (!s.color || s.width <= 0) return {};
  const dash = dashLengths(s.dash, s.width);
  return { stroke: colorCss(s.color), strokeWidth: s.width, ...(dash ? { dash } : {}) };
}

/** Past this many boxes above an item, its words stay whole: the cells would cost more. */
const MAX_HOLES = 32;

/**
 * The CSS clip of an item's words: its box, cut to its frame, less the boxes drawn above it, as a
 * `path(evenodd, …)` in the item's own pixels. The boxes are split into disjoint cells first, so
 * where two of them overlap stays hidden. Undefined when nothing cuts it.
 */
export function overlayClip(
  box: Bounds,
  frame: Bounds | undefined,
  above: ReadonlyArray<Bounds>,
): string | undefined {
  let x0 = 0;
  let y0 = 0;
  let x1 = box.w;
  let y1 = box.h;
  if (frame) {
    x0 = Math.max(x0, frame.x - box.x);
    y0 = Math.max(y0, frame.y - box.y);
    x1 = Math.min(x1, frame.x + frame.w - box.x);
    y1 = Math.min(y1, frame.y + frame.h - box.y);
  }
  const holes = above
    .map((b) => ({
      x0: Math.max(x0, b.x - box.x),
      y0: Math.max(y0, b.y - box.y),
      x1: Math.min(x1, b.x + b.w - box.x),
      y1: Math.min(y1, b.y + b.h - box.y),
    }))
    .filter((h) => h.x1 > h.x0 && h.y1 > h.y0);
  if (holes.length > MAX_HOLES) holes.length = 0;
  const framed = x0 > 0 || y0 > 0 || x1 < box.w || y1 < box.h;
  if (!holes.length && !framed) return undefined;
  const r = (v: number) => Math.round(v * 100) / 100;
  const rect = (a: number, b: number, c: number, d: number) =>
    `M${r(a)} ${r(b)}H${r(c)}V${r(d)}H${r(a)}Z`;
  let path = rect(x0, y0, x1, y1);
  if (holes.length) {
    const xs = [...new Set(holes.flatMap((h) => [h.x0, h.x1]))].sort((a, b) => a - b);
    const ys = [...new Set(holes.flatMap((h) => [h.y0, h.y1]))].sort((a, b) => a - b);
    for (let j = 0; j + 1 < ys.length; j++) {
      const cy = (ys[j]! + ys[j + 1]!) / 2;
      let start = -1;
      for (let i = 0; i < xs.length; i++) {
        const cx = i + 1 < xs.length ? (xs[i]! + xs[i + 1]!) / 2 : Number.NaN;
        const inside = holes.some((h) => cx > h.x0 && cx < h.x1 && cy > h.y0 && cy < h.y1);
        if (inside && start < 0) start = i;
        if (!inside && start >= 0) {
          // One rectangle per run of cells in a row: disjoint, so even-odd cuts each once.
          path += rect(xs[start]!, ys[j]!, xs[i]!, ys[j + 1]!);
          start = -1;
        }
      }
    }
  }
  return `path(evenodd, "${path}")`;
}
