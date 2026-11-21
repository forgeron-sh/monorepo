// Comparing a period with another: the picker of a period with what it is compared to.
//
// Without children it draws the period, `vs`, the comparison and a summary. With children they are
// the parts:
//
//   <DateRangeCompare defaultValue={period} onChange={apply}>
//     <DateRangeComparePeriod />
//     <DateRangeCompareVs />
//     <DateRangeCompareSelect />
//     <DateRangeCompareCustom />
//     <DateRangeCompareSummary />
//   </DateRangeCompare>

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "../cx";
import { formatShort, toIso } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Select } from "../select";
import { renderPart } from "../part";
import { DateRangePicker, type RangePreset } from "../time";
import {
  dashboardCompareRanges,
  type DashboardCompare,
  type DashboardPeriod,
  type DashboardRanges,
} from "./dashboard-model";

export interface DateRangeCompareProps extends Omit<
  ComponentProps<"div">,
  "className" | "onChange" | "defaultValue"
> {
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
  asChild?: boolean;
  /** The parts. Without them: the whole picker. */
  children?: ReactNode;
}

const EMPTY: DashboardPeriod = { range: { from: null, to: null }, compare: "none" };

const COMPARE_LABEL: Record<DashboardCompare, string> = {
  none: "No comparison",
  "previous-period": "Previous period",
  "previous-year": "Previous year",
  custom: "Custom period",
};

interface DateRangeCompareContext {
  label: string;
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  /** The two ranges the period works out to. */
  ranges: DashboardRanges;
  compareOptions: ReadonlyArray<DashboardCompare>;
  /** What both pickers share: today, presets, min, max, disabled. */
  pickers: {
    today: string;
    presets?: ReadonlyArray<RangePreset>;
    min?: string;
    max?: string;
    disabled?: boolean;
  };
  /** A range in words: `Nov 1 → Nov 30`. */
  text: (range: { from: string | null; to: string | null } | null) => string;
}

const Ctx = createContext<DateRangeCompareContext | null>(null);

/** The comparison a part is in: the period, its ranges, what the pickers share. */
export function useDateRangeCompare(part = "useDateRangeCompare"): DateRangeCompareContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <DateRangeCompare>.`);
  return ctx;
}

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
  asChild,
  children,
  ...rest
}: DateRangeCompareProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const year = Number(today.slice(0, 4));
  const [period, setPeriod] = useControllableState<DashboardPeriod>({
    value,
    defaultValue,
    onChange: onChange ? (next) => onChange(next, dashboardCompareRanges(next)) : undefined,
  });
  const ctx: DateRangeCompareContext = {
    label,
    period,
    setPeriod,
    ranges: dashboardCompareRanges(period),
    compareOptions,
    pickers: {
      today,
      ...(presets ? { presets } : {}),
      ...(min ? { min } : {}),
      ...(max ? { max } : {}),
      ...(disabled ? { disabled } : {}),
    },
    text: (r) =>
      r && r.from !== null && r.to !== null
        ? r.from === r.to
          ? formatShort(r.from, year)
          : `${formatShort(r.from, year)} → ${formatShort(r.to, year)}`
        : "",
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart("div", cx("fg-dash-compare", className), asChild, {
        "data-slot": "date-range-compare",
        role: "group",
        "aria-label": `${label} and comparison`,
        ...rest,
        children: children ?? (
          <>
            <DateRangeComparePeriod />
            <DateRangeCompareVs />
            <DateRangeCompareSelect />
            <DateRangeCompareCustom />
            <DateRangeCompareSummary />
          </>
        ),
      })}
    </Ctx.Provider>
  );
}

/** The picker of the period. */
export function DateRangeComparePeriod(
  props: Omit<ComponentProps<typeof DateRangePicker>, "label" | "value" | "onChange">,
) {
  const { label, period, setPeriod, pickers } = useDateRangeCompare("DateRangeComparePeriod");
  return (
    <DateRangePicker
      data-slot="date-range-compare-period"
      label={label}
      value={period.range}
      onChange={(range) => setPeriod({ ...period, range })}
      {...pickers}
      {...props}
    />
  );
}

/** `vs`, decorative. */
export function DateRangeCompareVs({ className, children, ...rest }: ComponentProps<"span">) {
  return (
    <span
      data-slot="date-range-compare-vs"
      aria-hidden="true"
      {...rest}
      className={cx("fg-dash-compare-vs", className)}
    >
      {children ?? "vs"}
    </span>
  );
}

/** What the period is compared to: nothing, the period before, a year before, a custom one. */
export function DateRangeCompareSelect({ className }: { className?: string }) {
  const { period, setPeriod, compareOptions, pickers } =
    useDateRangeCompare("DateRangeCompareSelect");
  return (
    <Select
      data-slot="date-range-compare-select"
      aria-label="Compare to"
      value={period.compare}
      disabled={pickers.disabled}
      options={compareOptions.map((c) => ({ value: c, label: COMPARE_LABEL[c] }))}
      onChange={(event) =>
        setPeriod({ ...period, compare: event.target.value as DashboardCompare })
      }
      className={className}
    />
  );
}

/** The picker of the custom period; only while the comparison is `custom`. */
export function DateRangeCompareCustom(
  props: Omit<ComponentProps<typeof DateRangePicker>, "label" | "value" | "onChange">,
) {
  const { period, setPeriod, pickers } = useDateRangeCompare("DateRangeCompareCustom");
  if (period.compare !== "custom") return null;
  return (
    <DateRangePicker
      data-slot="date-range-compare-custom"
      label="Compared period"
      value={period.custom ?? { from: null, to: null }}
      onChange={(custom) => setPeriod({ ...period, custom })}
      clearable={false}
      {...pickers}
      {...props}
    />
  );
}

/** The two ranges in words. Nothing until a period is chosen. */
export function DateRangeCompareSummary({ className, children, ...rest }: ComponentProps<"p">) {
  const { ranges, text } = useDateRangeCompare("DateRangeCompareSummary");
  if (!ranges.current) return null;
  return (
    <p
      data-slot="date-range-compare-summary"
      aria-live="polite"
      {...rest}
      className={cx("fg-dash-compare-sum", className)}
    >
      {children ?? (
        <>
          <span>{text(ranges.current)}</span>
          {ranges.previous ? (
            <span className="fg-dash-compare-prev">vs {text(ranges.previous)}</span>
          ) : null}
        </>
      )}
    </p>
  );
}
