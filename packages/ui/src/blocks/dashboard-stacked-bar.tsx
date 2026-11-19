// Stacked bars, horizontal or vertical: each row split into the series that make it up, every
// series with its own pixel pattern and a key that turns it on or off. Totals are text; the whole
// is also a table.

import { useState } from "react";
import { cx } from "../cx";
import { dashboardStack } from "./dashboard-model";
import { DashLegend, dashSeries } from "./dashboard-parts";

export interface StackedBarSeries {
  /** Key of the value in each item. */
  key: string;
  label: string;
}

export interface StackedBarItem {
  label: string;
  /** One value per series key. */
  values: Readonly<Record<string, number>>;
}

export interface StackedBarProps {
  /** Names the chart; also its caption. */
  title: string;
  series: ReadonlyArray<StackedBarSeries>;
  /** The bars, in order. */
  items: ReadonlyArray<StackedBarItem>;
  /** `horizontal` (default): one bar per row. `vertical`: columns. */
  orientation?: "horizontal" | "vertical";
  /** Every bar as long as the plot, showing shares instead of amounts. */
  normalize?: boolean;
  /** Writes a value. */
  format?: (value: number) => string;
  /** The label of the bar to stand out. */
  highlight?: string;
  /** Height of the plot of a vertical chart, in px. Default 160. */
  height?: number;
  className?: string;
}

/** Bars split into series; the key toggles a series, titles and the table give every figure. */
export function StackedBar({
  title,
  series,
  items,
  orientation = "horizontal",
  normalize = false,
  format = String,
  highlight,
  height = 160,
  className,
}: StackedBarProps) {
  const [hidden, setHidden] = useState<string[]>([]);
  const rows = dashboardStack(items, series, { hidden, normalize });
  const shown = series.filter((s) => !hidden.includes(s.key));
  const indexOf = (key: string) => series.findIndex((s) => s.key === key);
  const vertical = orientation === "vertical";
  return (
    <figure className={cx("fg-dash-stack", vertical && "fg-dash-stack-v", className)}>
      <figcaption className="fg-dash-title">{title}</figcaption>
      <DashLegend
        label={`${title}: series`}
        entries={series.map((s, i) => ({ key: s.key, label: s.label, k: i }))}
        off={hidden}
        onToggle={(key) =>
          setHidden((now) =>
            now.includes(key)
              ? now.filter((k) => k !== key)
              : now.length + 1 >= series.length
                ? now
                : [...now, key],
          )
        }
      />
      <ul className="fg-dash-stack-list" style={vertical ? { height: height + 36 } : undefined}>
        {rows.map((row) => (
          <li
            key={row.label}
            className={cx("fg-dash-stack-row", row.label === highlight && "fg-dash-hi")}
          >
            <span className="fg-dash-stack-label">{row.label}</span>
            <span
              className="fg-dash-stack-track"
              style={vertical ? { height } : undefined}
              aria-hidden="true"
            >
              {row.segments.map((seg) =>
                seg.value > 0 ? (
                  <span
                    key={seg.key}
                    className={cx("fg-dash-seg", dashSeries(indexOf(seg.key)))}
                    style={{ [vertical ? "height" : "width"]: `${seg.share * 100}%` }}
                    title={`${row.label}, ${series[indexOf(seg.key)]?.label}: ${format(seg.value)}`}
                  />
                ) : null,
              )}
            </span>
            <span className="fg-dash-stack-total">{format(row.total)}</span>
          </li>
        ))}
      </ul>
      <table className="fg-visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Bar</th>
            {shown.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.segments.map((seg) => (
                <td key={seg.key}>{format(seg.value)}</td>
              ))}
              <td>{format(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
