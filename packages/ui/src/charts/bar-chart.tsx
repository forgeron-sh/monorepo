import type { HTMLAttributes } from "react";
import { cx } from "../cx";
import { useReport, useSeries } from "./parts";

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  data: ReadonlyArray<BarChartDatum>;
  /** Accessible name of the chart. */
  title: string;
  /** Formats the value shown at the end of each bar. */
  format?: (value: number) => string;
  /** The label of the one bar to stand out, in ember: this month, the leader, the outlier. */
  highlight?: string;
  /** The series in a `ChartContainer` config that colours the bars and names them in the tooltip. */
  dataKey?: string;
}

/**
 * Horizontal pixel bars (a solid cap on scan lines); every bar carries its label and value as text,
 * so the chart reads without colour. One bar may stand out in ember.
 */
export function BarChart({
  data,
  title,
  format = String,
  highlight,
  dataKey,
  className,
  style,
  ...rest
}: BarChartProps) {
  const series = useSeries(dataKey, {
    fallback: "var(--ink-muted)",
    name: title,
    cssVar: "--fg-bar-series",
  });
  const report = useReport();
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <figure className={cx("fg-bars", className)} style={{ ...series.style, ...style }} {...rest}>
      <figcaption className="fg-bars-title">{title}</figcaption>
      <ul className="fg-bars-list">
        {data.map((d) => (
          <li
            key={d.label}
            className={cx("fg-bars-row", d.label === highlight && "fg-bars-hi")}
            {...report(() => ({ label: d.label, payload: [series.line(format(d.value), d)] }))}
          >
            <span className="fg-bars-label">{d.label}</span>
            <span className="fg-bars-track" aria-hidden="true">
              <span
                className="fg-bars-fill"
                style={{ width: `${max > 0 ? (Math.max(0, d.value) / max) * 100 : 0}%` }}
              />
            </span>
            <span className="fg-bars-value">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
