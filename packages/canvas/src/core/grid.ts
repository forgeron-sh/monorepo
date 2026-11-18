// The pixel grid: one dot every `size` world units, items snap to it.

import type { Bounds, Point } from "./types";

export interface GridOptions {
  /** World units between two dots and between two snap positions. */
  size: number;
  /** Moves and resizes land on the grid; Alt held while dragging turns it off. */
  snap: boolean;
  /** Draws the dots. */
  visible: boolean;
}

export const DEFAULT_GRID: GridOptions = { size: 20, snap: true, visible: true };

export function snap(value: number, size: number): number {
  return size > 0 ? Math.round(value / size) * size : value;
}

export function snapPoint(p: Point, size: number): Point {
  return { x: snap(p.x, size), y: snap(p.y, size) };
}

/** The rectangle with its corners on the grid, never smaller than one cell. */
export function snapBounds(b: Bounds, size: number): Bounds {
  const x = snap(b.x, size);
  const y = snap(b.y, size);
  return {
    x,
    y,
    w: Math.max(size, snap(b.x + b.w, size) - x),
    h: Math.max(size, snap(b.y + b.h, size) - y),
  };
}

/**
 * The screen distance between two drawn dots at a zoom: the grid size, doubled until the dots are
 * at least `minGap` pixels apart, so a far zoom does not turn the grid into a grey wash.
 */
export function gridStep(size: number, zoom: number, minGap = 14): number {
  let step = size * zoom;
  if (step <= 0) return minGap;
  while (step < minGap) step *= 2;
  return step;
}

/** The first dot at or after 0 on screen, for an offset (the viewport translation) and a step. */
export function gridOffset(offset: number, step: number): number {
  return ((offset % step) + step) % step;
}
