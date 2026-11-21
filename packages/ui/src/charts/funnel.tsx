// A funnel: the stages a thing goes through, each a stepped bar as long as its share of the first
// stage, with the count and the conversion from the stage before. The same numbers are a table.

import type { HTMLAttributes } from "react";
import { cx } from "../cx";
import { dashboardFormatPercent, dashboardFunnel } from "./model";
import { ChartTable, useReport, useSeries } from "./parts";

export interface FunnelItem {
  label: string;
  /** How many reached this stage. */
  value: number;
}

export interface FunnelProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  /** The stages, first to last. */
  items: ReadonlyArray<FunnelItem>;
  /** Writes a count. */
  format?: (value: number) => string;
  /** The label of the stage drawn in ember: the one that matters. */
  highlight?: string;
  /** What a stage counts, in the text alternative: `deals`. */
  unit?: string;
  /** The series in a `ChartContainer` config that colours the bars and names them in the tooltip. */
  dataKey?: string;
}

/**
 * Stages as stepped pixel bars, each with its count and its conversion from the stage before
 * (`42%`); the whole funnel's conversion closes it. Every number is also text, and a table for
 * assistive technology.
 */
export function Funnel({
  title,
  items,
  format = String,
  highlight,
  unit = "",
  dataKey,
  className,
  style,
  ...rest
}: FunnelProps) {
  const series = useSeries(dataKey, { fallback: "var(--ink-muted)", name: title });
  const report = useReport();
  const { rows, overall } = dashboardFunnel(items);
  const noun = unit ? ` ${unit}` : "";
  return (
    <figure
      className={cx("fg-dash-funnel", className)}
      style={{ ...series.style, ...style }}
      {...rest}
    >
      <figcaption className="fg-dash-title">{title}</figcaption>
      <ol className="fg-dash-fun-list">
        {rows.map((row, i) => (
          <li
            key={row.label}
            className={cx("fg-dash-fun-row", row.label === highlight && "fg-dash-hi")}
            title={`${row.label}: ${format(row.value)}${noun}${
              row.ofPrevious !== null
                ? `, ${dashboardFormatPercent(row.ofPrevious)} of ${rows[i - 1]!.label}`
                : ""
            }`}
            {...report(() => ({
              label: row.label,
              payload: [
                series.line(`${format(row.value)}${noun}`, row),
                ...(row.ofPrevious !== null
                  ? [
                      {
                        dataKey: "ofPrevious",
                        name: `Of ${rows[i - 1]!.label}`,
                        value: dashboardFormatPercent(row.ofPrevious),
                        color: "var(--ink-dim)",
                      },
                    ]
                  : []),
              ],
            }))}
          >
            <span className="fg-dash-fun-label">{row.label}</span>
            <span className="fg-dash-fun-track" aria-hidden="true">
              <span
                className="fg-dash-fun-fill"
                style={{ width: `${Math.max(row.value > 0 ? 1 : 0, row.ofFirst * 100)}%` }}
              />
            </span>
            <span className="fg-dash-fun-value">
              {format(row.value)}
              <em>{row.ofPrevious === null ? "" : dashboardFormatPercent(row.ofPrevious)}</em>
            </span>
          </li>
        ))}
      </ol>
      {rows.length > 1 ? (
        <p className="fg-dash-fun-overall">
          Overall <b>{dashboardFormatPercent(overall, { digits: 1 })}</b> of {rows[0]!.label} reach{" "}
          {rows[rows.length - 1]!.label}
        </p>
      ) : null}
      <ChartTable
        caption={title}
        columns={["Stage", "Count", "Of the first stage", "Of the stage before"]}
        rows={rows.map((row) => ({
          key: row.label,
          head: row.label,
          cells: [
            format(row.value),
            dashboardFormatPercent(row.ofFirst),
            row.ofPrevious === null ? "" : dashboardFormatPercent(row.ofPrevious),
          ],
        }))}
      />
    </figure>
  );
}
