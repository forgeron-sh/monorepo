// A funnel: the stages a thing goes through, each a stepped bar as long as its share of the first
// stage, with the count and the conversion from the stage before. The same numbers are a table.

import { cx } from "../cx";
import { dashboardFormatPercent, dashboardFunnel } from "./dashboard-model";

export interface FunnelItem {
  label: string;
  /** How many reached this stage. */
  value: number;
}

export interface FunnelProps {
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
  className?: string;
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
  className,
}: FunnelProps) {
  const { rows, overall } = dashboardFunnel(items);
  const noun = unit ? ` ${unit}` : "";
  return (
    <figure className={cx("fg-dash-funnel", className)}>
      <figcaption className="fg-dash-title">{title}</figcaption>
      <ol className="fg-dash-fun-list">
        {rows.map((row) => (
          <li
            key={row.label}
            className={cx("fg-dash-fun-row", row.label === highlight && "fg-dash-hi")}
            title={`${row.label}: ${format(row.value)}${noun}${
              row.ofPrevious !== null
                ? `, ${dashboardFormatPercent(row.ofPrevious)} of ${items[rows.indexOf(row) - 1]!.label}`
                : ""
            }`}
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
      <table className="fg-visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Count</th>
            <th scope="col">Of the first stage</th>
            <th scope="col">Of the stage before</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{format(row.value)}</td>
              <td>{dashboardFormatPercent(row.ofFirst)}</td>
              <td>{row.ofPrevious === null ? "" : dashboardFormatPercent(row.ofPrevious)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
