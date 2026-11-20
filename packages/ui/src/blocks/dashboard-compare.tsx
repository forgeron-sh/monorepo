// Comparing a period with another: the picker of a period with what it is compared to.

import { useState } from "react";
import { cx } from "../cx";
import { formatShort, toIso } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Select } from "../select";
import { DateRangePicker, type RangePreset } from "../time";
import {
  dashboardCompareRanges,
  type DashboardCompare,
  type DashboardPeriod,
  type DashboardRanges,
} from "./dashboard-model";

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
