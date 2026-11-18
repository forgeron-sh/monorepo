// Pixel charts after the Dashboard prototype: a step line in ember, one chart pixel to two CSS
// pixels, a dithered area under it, the previous period dotted in grey. Drawn in an SVG of whole
// pixels (`crispEdges`), never smoothed.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "../cx";

/** One CSS pixel per chart pixel would be too fine: a chart pixel is two. */
const P = 2;

const rect = (x: number, y: number, w: number, h: number) =>
  w > 0 && h > 0 ? `M${x} ${y}h${w}v${h}h-${w}z` : "";

interface StepPaths {
  line: string;
  area: string;
  /** The steps alone, one pixel in two: a line behind the line. */
  dots: string;
}

/**
 * The step line of `values` on a `cols` × `rows` grid of chart pixels, between `min` (bottom row)
 * and `max` (`top` rows under the top edge).
 */
function stepPaths(
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

const dottedRow = (y: number, cols: number, every: number) => {
  let d = "";
  for (let x = 0; x < cols; x += every) d += rect(x, y, 1, 1);
  return d;
};

export interface ChartPoint {
  /** Written under the axis and in the readout: `Nov 12`, `W46`. */
  label: string;
  value: number;
}

export interface LineChartProps {
  /** Names the chart; also its caption. */
  title: string;
  points: ReadonlyArray<ChartPoint>;
  /** The same points one period earlier, dotted in grey behind the line. */
  previous?: ReadonlyArray<number>;
  /** Formats a value in the readout, the top of the axis and the table read aloud. */
  format?: (value: number) => string;
  /** The height of the plot in px. */
  height?: number;
  className?: string;
}

/** Measures the width of an element, and follows it. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * A step line over time, in pixels. Hover or the arrows read one point in the header; the values
 * are also a table for assistive technology. The axis starts at zero.
 */
export function LineChart({
  title,
  points,
  previous,
  format = String,
  height = 160,
  className,
}: LineChartProps) {
  const id = useId();
  const [plot, width] = useWidth<HTMLDivElement>(320);
  const [active, setActive] = useState<number | null>(null);
  const shown = active ?? points.length - 1;
  const point = points[shown];

  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values, ...(previous ?? []));
  const cols = Math.max(1, Math.floor(width / P));
  const rows = Math.max(8, Math.floor(height / P));
  const { line, area } = stepPaths(values, cols, rows, 0, max, 6);
  const before = previous?.length ? stepPaths(previous, cols, rows, 0, max, 6).dots : "";
  const grid = [0.25, 0.5, 0.75].map((f) => dottedRow(Math.round(rows * f), cols, 3)).join("");
  const xOf = (i: number) => Math.round((i * cols) / Math.max(1, points.length));

  const move = (next: number) => setActive(Math.max(0, Math.min(points.length - 1, next)));
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") move(shown + 1);
    else if (event.key === "ArrowLeft") move(shown - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(points.length - 1);
    else return;
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0) return;
    move(Math.floor(((event.clientX - box.left) / box.width) * points.length));
  };
  const middle = points[Math.floor((points.length - 1) / 2)];

  return (
    <figure className={cx("fg-line", className)}>
      <div className="fg-line-head">
        <figcaption className="fg-line-title" id={`${id}-title`}>
          {title}
        </figcaption>
        {point ? (
          <output className="fg-line-readout" aria-live="polite">
            <span className="fg-line-readout-label">{point.label}</span>
            <b>{format(point.value)}</b>
            {previous?.[shown] !== undefined ? (
              <span className="fg-line-readout-label">before {format(previous[shown]!)}</span>
            ) : null}
          </output>
        ) : null}
      </div>
      <div
        ref={plot}
        className="fg-line-plot"
        style={{ height: rows * P }}
        tabIndex={points.length ? 0 : undefined}
        role="group"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
      >
        <span className="fg-line-max" aria-hidden="true">
          {format(max)}
        </span>
        <svg
          width={cols * P}
          height={rows * P}
          viewBox={`0 0 ${cols} ${rows}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <defs>
            <pattern id={`${id}-dots`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="1" height="1" className="fg-line-ink-accent" />
              <rect x="2" y="2" width="1" height="1" className="fg-line-ink-accent" />
            </pattern>
          </defs>
          <path d={grid} className="fg-line-ink-grid" />
          {active !== null ? (
            <path
              d={rect(xOf(shown), 0, Math.max(1, xOf(shown + 1) - xOf(shown)), rows - 1)}
              className="fg-line-ink-hover"
            />
          ) : null}
          <path d={area} fill={`url(#${id}-dots)`} />
          {before ? <path d={before} className="fg-line-ink-before" /> : null}
          <path d={line} className="fg-line-ink-accent" />
          <path d={rect(0, rows - 1, cols, 1)} className="fg-line-ink-grid" />
        </svg>
      </div>
      <p className="fg-visually-hidden" id={`${id}-hint`}>
        Left and right arrows read one point.
      </p>
      {points.length ? (
        <div className="fg-line-axis" aria-hidden="true">
          <span>{points[0]!.label}</span>
          {points.length > 2 && middle ? <span>{middle.label}</span> : null}
          {points.length > 1 ? <span>{points[points.length - 1]!.label}</span> : null}
        </div>
      ) : null}
      <table className="fg-visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">Value</th>
            {previous?.length ? <th scope="col">Before</th> : null}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={`${p.label}-${i}`}>
              <th scope="row">{p.label}</th>
              <td>{format(p.value)}</td>
              {previous?.length ? (
                <td>{previous[i] === undefined ? "" : format(previous[i]!)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export interface SparklineProps {
  values: ReadonlyArray<number>;
  /** Width and height in px; whole chart pixels are two px. */
  width?: number;
  height?: number;
  /** `accent` (default): the ember line of a figure that matters; `ink`: a quiet one. */
  tone?: "accent" | "ink";
  /** Names the trend ("Signups, last 12 weeks"); without it the line is decorative. */
  label?: string;
  className?: string;
}

/** A small step line of a trend, from its lowest to its highest value: next to a figure. */
export function Sparkline({
  values,
  width = 96,
  height = 24,
  tone = "accent",
  label,
  className,
}: SparklineProps) {
  const cols = Math.max(1, Math.floor(width / P));
  const rows = Math.max(2, Math.floor(height / P));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const { line } = values.length ? stepPaths(values, cols, rows, min, max) : { line: "" };
  return (
    <svg
      className={cx("fg-spark", tone === "ink" && "fg-spark-ink", className)}
      width={cols * P}
      height={rows * P}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path d={line} />
    </svg>
  );
}
