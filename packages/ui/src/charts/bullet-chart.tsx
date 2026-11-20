// Bullet bars: one row per measure, the value as a solid bar over bands of dither (poor, fair,
// good: the denser, the further), the target as a tick across. A gauge that fits in a row, so
// several measures compare at a glance. Every row says its value and how far it is from target.

import type { HTMLAttributes } from "react";
import { cx } from "../cx";
import { dashboardBullet, dashboardFormatPercent } from "./model";
import { useReport, useSeries } from "./parts";

export interface BulletItem {
  label: string;
  value: number;
  /** What it should reach: a tick across the bar. */
  target?: number;
  /** Where the bands end, ascending: `[50, 75, 100]` for poor, fair, good. Up to three. */
  bands?: ReadonlyArray<number>;
  /** The end of this row's scale; default the last band, else a fifth above value and target. */
  max?: number;
  /** Writes this row's values, over the chart's `format`. */
  format?: (value: number) => string;
}

export interface BulletChartProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  items: ReadonlyArray<BulletItem>;
  /** Writes a value. */
  format?: (value: number) => string;
  /** The series in a `ChartContainer` config that colours the bars. */
  dataKey?: string;
}

/** Measures against their targets, one row each: bar, bands, target tick, value and share of target. */
export function BulletChart({
  title,
  items,
  format = String,
  dataKey,
  className,
  style,
  ...rest
}: BulletChartProps) {
  const series = useSeries(dataKey, { fallback: "var(--accent)", name: "Value" });
  const report = useReport();
  return (
    <figure className={cx("fg-bullet", className)} style={{ ...series.style, ...style }} {...rest}>
      <figcaption className="fg-bars-title">{title}</figcaption>
      <ul className="fg-bullet-list">
        {items.map((item) => {
          const write = item.format ?? format;
          const s = dashboardBullet(item.value, item);
          const met = s.ofTarget !== null && s.ofTarget >= 1;
          const bands = s.bands.slice(-3);
          return (
            <li
              key={item.label}
              className={cx("fg-bullet-row", met && "fg-bullet-met")}
              {...report(() => ({
                label: item.label,
                payload: [
                  series.line(write(item.value), item),
                  ...(item.target !== undefined
                    ? [
                        {
                          dataKey: "target",
                          name: "Target",
                          value: write(item.target),
                          color: "var(--ink)",
                        },
                      ]
                    : []),
                ],
              }))}
            >
              <span className="fg-bullet-label">{item.label}</span>
              <span
                className="fg-bullet-track"
                role="meter"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={s.max}
                aria-valuenow={item.value}
                aria-valuetext={`${write(item.value)}${
                  item.target !== undefined
                    ? `, target ${write(item.target)}, ${dashboardFormatPercent(s.ofTarget ?? 0)} of it`
                    : ""
                }`}
              >
                {bands.map((end, i) => (
                  <span
                    key={i}
                    className={`fg-bullet-band fg-bullet-band-${bands.length - i}`}
                    style={{ width: `${end * 100}%`, zIndex: bands.length - i }}
                  />
                ))}
                <span className="fg-bullet-bar" style={{ width: `${s.value * 100}%` }} />
                {s.target !== null ? (
                  <span className="fg-bullet-target" style={{ left: `${s.target * 100}%` }} />
                ) : null}
              </span>
              <span className="fg-bullet-value">
                <b>{write(item.value)}</b>
                {s.ofTarget !== null ? (
                  <span className="fg-bullet-share">
                    {met ? "✓ " : ""}
                    {dashboardFormatPercent(s.ofTarget)}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
