// Shared by the pixel charts: a chart pixel is two CSS pixels; paths are runs of whole pixels
// (never an anti-aliased curve); a hook follows the width of the box a chart is drawn in.

import { useEffect, useRef, useState } from "react";

/** One CSS pixel per chart pixel would be too fine: a chart pixel is two. */
export const PX = 2;

export const rect = (x: number, y: number, w: number, h: number) =>
  w > 0 && h > 0 ? `M${x} ${y}h${w}v${h}h-${w}z` : "";

export interface StepPaths {
  line: string;
  area: string;
  /** The steps alone, one pixel in two: a line behind the line. */
  dots: string;
}

/**
 * The step line of `values` on a `cols` × `rows` grid of chart pixels, between `min` (bottom row)
 * and `max` (`top` rows under the top edge).
 */
export function stepPaths(
  values: ReadonlyArray<number>,
  cols: number,
  rows: number,
  min: number,
  max: number,
  top = 0,
): StepPaths {
  const span = max - min || 1;
  const n = values.length;
  const yOf = (v: number) => rows - 1 - Math.round(((v - min) / span) * (rows - 1 - top));
  const xOf = (i: number) => Math.round((i * cols) / n);
  let line = "";
  let area = "";
  let dots = "";
  let before: number | null = null;
  values.forEach((v, i) => {
    const x0 = xOf(i);
    const x1 = xOf(i + 1);
    const y = yOf(v);
    line += rect(x0, y, x1 - x0, 1);
    if (before !== null && before !== y) {
      line += rect(x0, Math.min(before, y), 1, Math.abs(before - y) + 1);
    }
    area += rect(x0, y + 1, x1 - x0, rows - 1 - (y + 1));
    for (let x = x0; x < x1; x += 2) dots += rect(x, y, 1, 1);
    before = y;
  });
  return { line, area, dots };
}

export const dottedRow = (y: number, cols: number, every: number) => {
  let d = "";
  for (let x = 0; x < cols; x += every) d += rect(x, y, 1, 1);
  return d;
};

/** The width of an element, followed as it changes; `fallback` where nothing can be measured. */
export function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    setWidth(Math.floor(el.getBoundingClientRect().width) || fallback);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fallback]);
  return [ref, width] as const;
}
