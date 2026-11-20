// A small step line of a trend, from its lowest to its highest value: next to a figure.

import type { SVGAttributes } from "react";
import { cx } from "../cx";
import { useSeries } from "./parts";
import { PX, stepPaths } from "./scale";

export interface SparklineProps extends Omit<
  SVGAttributes<SVGSVGElement>,
  "values" | "width" | "height" | "children"
> {
  values: ReadonlyArray<number>;
  /** Width and height in px; whole chart pixels are two px. */
  width?: number;
  height?: number;
  /** `accent` (default): the ember line of a figure that matters; `ink`: a quiet one. */
  tone?: "accent" | "ink";
  /** Names the trend ("Signups, last 12 weeks"); without it the line is decorative. */
  label?: string;
  /** The series in a `ChartContainer` config that colours the line; default the first. */
  dataKey?: string;
}

/** A small step line of a trend, from its lowest to its highest value: next to a figure. */
export function Sparkline({
  values,
  width = 96,
  height = 24,
  tone = "accent",
  label,
  dataKey,
  className,
  style,
  ...rest
}: SparklineProps) {
  const series = useSeries(dataKey, { first: true, fallback: "var(--accent)", name: label });
  const cols = Math.max(1, Math.floor(width / PX));
  const rows = Math.max(2, Math.floor(height / PX));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const { line } = values.length ? stepPaths(values, cols, rows, min, max) : { line: "" };
  return (
    <svg
      className={cx("fg-spark", tone === "ink" && "fg-spark-ink", className)}
      width={cols * PX}
      height={rows * PX}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      style={{ ...series.style, ...style }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
    >
      <path d={line} />
    </svg>
  );
}
