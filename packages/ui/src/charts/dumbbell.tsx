// A dumbbell: two moments per row on one scale, a hollow square for before and a solid one for
// after, the segment between them in the tone of the change. Who moved, which way and how far
// reads at a glance; the change is also written, with an arrow and a sign.

import type { HTMLAttributes } from "react";
import { cx } from "../cx";
import { dashboardDeltaWay, dashboardExtent, dashboardSigned } from "./model";
import { TONE_VARS, useReport, useStateColors } from "./parts";

export interface DumbbellItem {
  label: string;
  /** The value before. */
  from: number;
  /** The value after. */
  to: number;
}

export interface DumbbellProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  items: ReadonlyArray<DumbbellItem>;
  /** The names of the two moments, in the key. Default `Before`, `After`. */
  fromLabel?: string;
  toLabel?: string;
  /** Writes a value. */
  format?: (value: number) => string;
  /** Which way is good news: `down` for a response time. Default `up`. */
  better?: "up" | "down";
  /** The order of the rows: as given (default), by the size of the change, or by the value after. */
  sort?: "none" | "change" | "to";
  /** The scale starts at zero. Default false: it holds the values, with a little room. */
  zero?: boolean;
}

/** In a `ChartContainer`, the config keys `from` and `to` colour the two marks, `good` and `bad` the change. */
const VARS = { ...TONE_VARS, from: "--fg-bell-from-c", to: "--fg-bell-to-c" };

/** Two values per row, before and after, on one shared scale. */
export function Dumbbell({
  title,
  items,
  fromLabel = "Before",
  toLabel = "After",
  format = String,
  better = "up",
  sort = "none",
  zero = false,
  className,
  style,
  ...rest
}: DumbbellProps) {
  const colors = useStateColors(VARS);
  const report = useReport();
  const [lo, hi] = dashboardExtent(
    items.flatMap((i) => [i.from, i.to]),
    { zero },
  );
  const at = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const rows =
    sort === "change"
      ? [...items].sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
      : sort === "to"
        ? [...items].sort((a, b) => b.to - a.to)
        : items;
  const signed = (v: number) => dashboardSigned(format, v, "±0");
  return (
    <figure className={cx("fg-bell", className)} style={{ ...colors.style, ...style }} {...rest}>
      <div className="fg-dash-head">
        <figcaption className="fg-dash-title">{title}</figcaption>
        <ul className="fg-bell-key" aria-hidden="true">
          <li>
            <span className="fg-bell-dot fg-bell-from" />
            {fromLabel}
          </li>
          <li>
            <span className="fg-bell-dot fg-bell-to" />
            {toLabel}
          </li>
        </ul>
      </div>
      <ul className="fg-bell-list">
        {rows.map((item) => {
          // Rounded off the float noise of a subtraction (9.8 − 5.1 is 4.700000000000001).
          const change = Number((item.to - item.from).toPrecision(12));
          // A change of more than a hair, in the units of the scale.
          const { way, tone } = dashboardDeltaWay(change / (hi - lo || 1), better, 2);
          const left = Math.min(at(item.from), at(item.to));
          const width = Math.abs(at(item.to) - at(item.from));
          return (
            <li
              key={item.label}
              className={cx("fg-bell-row", `fg-bell-${tone}`)}
              {...report(() => ({
                label: item.label,
                payload: [
                  {
                    dataKey: "from",
                    name: fromLabel,
                    value: format(item.from),
                    color: colors.color("from", "var(--ink-muted)"),
                  },
                  {
                    dataKey: "to",
                    name: toLabel,
                    value: format(item.to),
                    color: colors.color("to", "var(--ink)"),
                  },
                ],
              }))}
            >
              <span className="fg-bell-label">{item.label}</span>
              <span className="fg-bell-track" aria-hidden="true">
                <span className="fg-bell-span" style={{ left: `${left}%`, width: `${width}%` }} />
                <span className="fg-bell-dot fg-bell-from" style={{ left: `${at(item.from)}%` }} />
                <span className="fg-bell-dot fg-bell-to" style={{ left: `${at(item.to)}%` }} />
              </span>
              <span className="fg-bell-value">
                <span className="fg-visually-hidden">
                  {fromLabel} {format(item.from)}, {toLabel}
                </span>{" "}
                <b>{format(item.to)}</b>
                <span className="fg-bell-delta">
                  <span aria-hidden="true">
                    {way === "up" ? "↗" : way === "down" ? "↘" : "→"}
                  </span>{" "}
                  {signed(change)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
