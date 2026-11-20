// Bars that leave a central zero, left when below it and right when above: a gap to a budget, a
// gain or a loss, a score around neutral. Each side can be named ("Under budget", "Over"); a rise
// is scan lines, a fall a checker, and every bar writes its signed value.

import type { HTMLAttributes } from "react";
import { cx } from "../cx";
import { dashboardSigned } from "./model";
import { TONE_VARS, useReport, useStateColors } from "./parts";

export interface DivergingItem {
  label: string;
  /** Above zero goes right, below goes left. */
  value: number;
}

export interface DivergingBarProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** Names the chart; also its caption. */
  title: string;
  items: ReadonlyArray<DivergingItem>;
  /** What the left and the right sides mean, written over them: `["Under budget", "Over budget"]`. */
  sides?: readonly [string, string];
  /** Writes a value (its size: the sign is added). */
  format?: (value: number) => string;
  /** Which side is good news: `down` for an overspend. Default `up`. */
  better?: "up" | "down";
  /** Rows by value, highest first. Default false: as given. */
  sorted?: boolean;
}

const TONES = { good: "var(--success)", bad: "var(--danger)", flat: "var(--ink-muted)" } as const;

/** Values around zero as bars to the left or right of a central axis. */
export function DivergingBar({
  title,
  items,
  sides,
  format = String,
  better = "up",
  sorted = false,
  className,
  style,
  ...rest
}: DivergingBarProps) {
  const colors = useStateColors(TONE_VARS);
  const report = useReport();
  const reach = Math.max(1e-9, ...items.map((i) => Math.abs(i.value)));
  const rows = sorted ? [...items].sort((a, b) => b.value - a.value) : items;
  const signed = (v: number) => dashboardSigned(format, v);
  return (
    <figure className={cx("fg-div", className)} style={{ ...colors.style, ...style }} {...rest}>
      <figcaption className="fg-bars-title">{title}</figcaption>
      {sides ? (
        <div className="fg-div-row fg-div-sides" aria-hidden="true">
          <span />
          <span className="fg-div-side-names">
            <span>← {sides[0]}</span>
            <span>{sides[1]} →</span>
          </span>
          <span />
        </div>
      ) : null}
      <ul className="fg-div-list">
        {rows.map((item) => {
          const way = item.value > 0 ? "up" : item.value < 0 ? "down" : "flat";
          const tone = way === "flat" ? "flat" : way === better ? "good" : "bad";
          const size = (Math.abs(item.value) / reach) * 50;
          return (
            <li
              key={item.label}
              className={cx("fg-div-row", `fg-div-${way}`, `fg-div-${tone}`)}
              {...report(() => ({
                label: item.label,
                payload: [
                  {
                    dataKey: "value",
                    name: title,
                    value: signed(item.value),
                    color: colors.color(tone, TONES[tone]),
                    payload: item,
                  },
                ],
              }))}
            >
              <span className="fg-div-label">{item.label}</span>
              <span className="fg-div-track" aria-hidden="true">
                <span
                  className="fg-div-bar"
                  style={
                    way === "down"
                      ? { right: "50%", width: `${size}%` }
                      : { left: "50%", width: `${size}%` }
                  }
                />
              </span>
              <span className="fg-div-value">{signed(item.value)}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
