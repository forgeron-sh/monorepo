// The delta of a figure (an arrow, a sign, a word and a colour, never the colour alone).

import { ArrowDownRight01Icon, ArrowUpRight01Icon, MinusSignIcon } from "@forgeron/icons";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { dashboardDeltaWay, dashboardFormatPercent } from "./model";
import { TONE_VARS, useStateColors } from "./parts";

export interface DeltaBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** How much it moved, as a ratio (0.12 reads +12%); `null` when there was nothing to compare with. */
  delta: number | null;
  /** Which way is good news: `up` (default) for revenue, `down` for open tickets. */
  better?: "up" | "down";
  /** Writes the delta; default a signed percent with one digit, `+12.4%`. */
  format?: (delta: number) => string;
  /** The figure it belongs to, shown before the delta. */
  value?: ReactNode;
  /** What it was compared with, after the delta: `vs last month`. */
  hint?: ReactNode;
  /** Writes `Better`, `Worse` or `Flat` after the figure. Default `true`. */
  showWord?: boolean;
  size?: "sm" | "md";
}

const signed = (delta: number) => dashboardFormatPercent(delta, { digits: 1, sign: true });

/**
 * A change, said three ways: an arrow for the direction, a sign on the number, and a word for
 * whether it is good news; the tone (green, red, grey) only repeats it.
 */
export function DeltaBadge({
  delta,
  better = "up",
  format = signed,
  value,
  hint,
  showWord = true,
  size = "md",
  className,
  style,
  ...rest
}: DeltaBadgeProps) {
  const colors = useStateColors(TONE_VARS);
  const state = delta === null ? null : dashboardDeltaWay(delta, better);
  const icon = !state
    ? MinusSignIcon
    : state.way === "up"
      ? ArrowUpRight01Icon
      : state.way === "down"
        ? ArrowDownRight01Icon
        : MinusSignIcon;
  const word = !state
    ? "No comparison"
    : state.tone === "good"
      ? "Better"
      : state.tone === "bad"
        ? "Worse"
        : "Flat";
  const way = !state ? "" : state.way === "flat" ? "unchanged" : state.way;
  return (
    <span
      className={cx("fg-dash-delta", size === "sm" && "fg-dash-delta-sm", className)}
      style={{ ...colors.style, ...style }}
      {...rest}
    >
      {value !== undefined ? <b className="fg-dash-delta-value">{value}</b> : null}
      <span className={cx("fg-dash-delta-chip", `fg-dash-delta-${state?.tone ?? "flat"}`)}>
        <Icon icon={icon} size={12} variant="mono" />
        <span className="fg-visually-hidden">{way ? `${way}, ` : ""}</span>
        {delta === null ? "—" : format(delta)}
        {showWord || delta === null ? (
          <span className="fg-dash-delta-word">{word}</span>
        ) : (
          <span className="fg-visually-hidden">, {word}</span>
        )}
      </span>
      {hint ? <span className="fg-dash-delta-hint">{hint}</span> : null}
    </span>
  );
}
