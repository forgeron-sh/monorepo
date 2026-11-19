// Comparing a period with another: the delta of a figure (an arrow, a sign, a word and a colour,
// never the colour alone), and the picker of a period with what it is compared to.

import { ArrowDownRight01Icon, ArrowUpRight01Icon, MinusSignIcon } from "@forgeron/icons";
import { useState, type ReactNode } from "react";
import { cx } from "../cx";
import { formatShort, toIso } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Select } from "../select";
import { DateRangePicker, type RangePreset } from "../time";
import {
  dashboardCompareRanges,
  dashboardDeltaWay,
  dashboardFormatPercent,
  type DashboardCompare,
  type DashboardPeriod,
  type DashboardRanges,
} from "./dashboard-model";

/* ---------------------------------------------------------------- DeltaBadge */

export interface DeltaBadgeProps {
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
  className?: string;
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
}: DeltaBadgeProps) {
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
    <span className={cx("fg-dash-delta", size === "sm" && "fg-dash-delta-sm", className)}>
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

/* ---------------------------------------------------------------- DateRangeCompare */

export interface DateRangeCompareProps {
  /** Names the period picker. Default `Period`. */
  label?: string;
  value?: DashboardPeriod;
  defaultValue?: DashboardPeriod;
  /** Hears the period and the two ranges it works out to; the previous one is `null` without a comparison. */
  onChange?: (value: DashboardPeriod, ranges: DashboardRanges) => void;
  /** What can be compared with, in order. Default all four. */
  compareOptions?: ReadonlyArray<DashboardCompare>;
  /** `YYYY-MM-DD`; the device's date by default. */
  today?: string;
  presets?: ReadonlyArray<RangePreset>;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

const EMPTY: DashboardPeriod = { range: { from: null, to: null }, compare: "none" };

const COMPARE_LABEL: Record<DashboardCompare, string> = {
  none: "No comparison",
  "previous-period": "Previous period",
  "previous-year": "Previous year",
  custom: "Custom period",
};

/**
 * A period and what it is compared with. Choosing the period and a comparison is the same value:
 * `{ range, compare, custom? }`; `dashboardCompareRanges(value)` gives the two ranges.
 */
export function DateRangeCompare({
  label = "Period",
  value,
  defaultValue = EMPTY,
  onChange,
  compareOptions = ["none", "previous-period", "previous-year", "custom"],
  today: todayProp,
  presets,
  min,
  max,
  disabled,
  className,
}: DateRangeCompareProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const year = Number(today.slice(0, 4));
  const [period, setPeriod] = useControllableState<DashboardPeriod>({
    value,
    defaultValue,
    onChange: onChange ? (next) => onChange(next, dashboardCompareRanges(next)) : undefined,
  });
  const ranges = dashboardCompareRanges(period);
  const text = (r: { from: string | null; to: string | null } | null) =>
    r && r.from !== null && r.to !== null
      ? r.from === r.to
        ? formatShort(r.from, year)
        : `${formatShort(r.from, year)} → ${formatShort(r.to, year)}`
      : "";
  const pickers = {
    today,
    ...(presets ? { presets } : {}),
    ...(min ? { min } : {}),
    ...(max ? { max } : {}),
    ...(disabled ? { disabled } : {}),
  };
  return (
    <div
      className={cx("fg-dash-compare", className)}
      role="group"
      aria-label={`${label} and comparison`}
    >
      <DateRangePicker
        label={label}
        value={period.range}
        onChange={(range) => setPeriod({ ...period, range })}
        {...pickers}
      />
      <span className="fg-dash-compare-vs" aria-hidden="true">
        vs
      </span>
      <Select
        aria-label="Compare to"
        value={period.compare}
        disabled={disabled}
        options={compareOptions.map((c) => ({ value: c, label: COMPARE_LABEL[c] }))}
        onChange={(event) =>
          setPeriod({ ...period, compare: event.target.value as DashboardCompare })
        }
      />
      {period.compare === "custom" ? (
        <DateRangePicker
          label="Compared period"
          value={period.custom ?? { from: null, to: null }}
          onChange={(custom) => setPeriod({ ...period, custom })}
          clearable={false}
          {...pickers}
        />
      ) : null}
      {ranges.current ? (
        <p className="fg-dash-compare-sum" aria-live="polite">
          <span>{text(ranges.current)}</span>
          {ranges.previous ? (
            <span className="fg-dash-compare-prev">vs {text(ranges.previous)}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
