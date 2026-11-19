// Parts the dashboard charts share: the pixel patterns that tell series apart without colour, the
// legend, the swatch, and the path of a ring drawn in whole pixels.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../cx";
import { dashboardPatternOn, type DashboardRingCell } from "./dashboard-model";

/** One chart pixel is two CSS pixels, as in the line chart. */
export const DASH_PX = 2;

/** The class of series `k`: its colour and its fill pattern (six, then they start again). */
export const dashSeries = (k: number) => `fg-dash-s${((k % 6) + 6) % 6}`;

/** The class that fills an SVG path with the colour of series `k`. */
export const dashFill = (k: number) => `fg-dash-f${((k % 6) + 6) % 6}`;

/**
 * The colour index of each item: the first is the lead (ember) by default; with `highlight`, that
 * one takes the lead and the others share the rest.
 */
export function dashSeriesIndexes(labels: ReadonlyArray<string>, highlight?: string): number[] {
  if (highlight === undefined || !labels.includes(highlight)) return labels.map((_, i) => i);
  let next = 0;
  return labels.map((label) => (label === highlight ? 0 : 1 + (next++ % 5)));
}

const rect = (x: number, y: number, w: number) => `M${x} ${y}h${w}v1h-${w}z`;

/** The pixels of a ring that are on for pattern `k`, as one path: runs of a row become one rectangle. */
export function dashRingPath(cells: ReadonlyArray<DashboardRingCell>, k: number): string {
  const on = cells
    .filter((c) => dashboardPatternOn(k, c.x, c.y))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  let d = "";
  for (let i = 0; i < on.length;) {
    const first = on[i]!;
    let run = 1;
    while (on[i + run] && on[i + run]!.y === first.y && on[i + run]!.x === first.x + run) run += 1;
    d += rect(first.x, first.y, run);
    i += run;
  }
  return d;
}

/** The little square of a legend: the pattern and colour of a series, never colour alone. */
function DashSwatch({ k, className }: { k: number; className?: string }) {
  return <span className={cx("fg-dash-swatch", dashSeries(k), className)} aria-hidden="true" />;
}

export interface DashLegendEntry {
  key: string;
  label: string;
  k: number;
  /** The value written after the label. */
  value?: ReactNode;
  /** The share written after the value. */
  share?: ReactNode;
}

/** The key of a chart: swatch, name and numbers. Toggles when `onToggle` is given. */
export function DashLegend({
  entries,
  label,
  onToggle,
  off = [],
  pressedMeans = "shown",
  className,
}: {
  entries: ReadonlyArray<DashLegendEntry>;
  label: string;
  /** Makes each entry a button that turns its series on or off, or spotlights it. */
  onToggle?: (key: string) => void;
  /** Keys that are off (`shown`) or on (`spotlight`). */
  off?: ReadonlyArray<string>;
  pressedMeans?: "shown" | "spotlight";
  className?: string;
}) {
  return (
    <ul className={cx("fg-dash-legend", className)} aria-label={label}>
      {entries.map((entry) => {
        const marked = off.includes(entry.key);
        const pressed = pressedMeans === "shown" ? !marked : marked;
        const body = (
          <>
            <DashSwatch k={entry.k} />
            <span className="fg-dash-legend-label">{entry.label}</span>
            {entry.value !== undefined ? (
              <span className="fg-dash-legend-value">{entry.value}</span>
            ) : null}
            {entry.share !== undefined ? (
              <span className="fg-dash-legend-share">{entry.share}</span>
            ) : null}
          </>
        );
        return (
          <li key={entry.key} className={cx(pressedMeans === "shown" && marked && "fg-dash-off")}>
            {onToggle ? (
              <button
                type="button"
                className="fg-dash-legend-item"
                aria-pressed={pressed}
                onClick={() => onToggle(entry.key)}
              >
                {body}
              </button>
            ) : (
              <span className="fg-dash-legend-item">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The width of an element, followed as it changes; `fallback` where nothing can be measured. */
export function useDashWidth<T extends HTMLElement>(fallback: number) {
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
