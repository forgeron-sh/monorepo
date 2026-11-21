// A time of day (TimePicker) and a span of days (DateRangePicker). Times travel as `HH:mm` in 24
// hours, days as `YYYY-MM-DD`, both without a time zone, like the Calendar.

import { Calendar03Icon, Cancel01Icon, Time01Icon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode, RefObject } from "react";
import { createContext, useContext, useRef, useState } from "react";
import { Calendar, type CalendarProps } from "./calendar";
import { cx } from "./cx";
import { addDays, addMonths, formatShort, parseIso, toIso } from "./dates";
import { useControllableState } from "./hooks/use-controllable";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------------------------------------------------------------- TimePicker */

/** `HH:mm` to hours and minutes, or null for anything else. */
export function parseTime(value: string | null | undefined): { h: number; m: number } | null {
  const hit = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!hit) return null;
  const h = Number(hit[1]);
  const m = Number(hit[2]);
  return h < 24 && m < 60 ? { h, m } : null;
}

/** `HH:mm` as a person reads it: `14:30`, or `2:30 PM` in 12 hours. */
export function formatTime(value: string, hour12 = false): string {
  const t = parseTime(value);
  if (!t) return value;
  if (!hour12) return `${pad(t.h)}:${pad(t.m)}`;
  return `${t.h % 12 || 12}:${pad(t.m)} ${t.h >= 12 ? "PM" : "AM"}`;
}

export interface TimePickerProps {
  /** Names the field, e.g. "Start time". */
  label: string;
  /** `HH:mm`, 24 hours, or null for none. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** Written in 12 hours with AM and PM. The value stays `HH:mm`. Default `false`. */
  hour12?: boolean;
  /** Minutes between the times of the list, and the jump of the arrows on the minutes. Default 15. */
  step?: number;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
  /** Given, `TimePicker` is the root of the parts and draws only what you put in. */
  children?: undefined;
}

/** The root of the composed time picker: the same props, and the parts as children. */
export type TimePickerRootProps = Omit<TimePickerProps, "children"> & { children: ReactNode };

type Segment = "hour" | "minute";

interface TimeState {
  label: string;
  current: string | null;
  setCurrent: (value: string | null) => void;
  t: { h: number; m: number } | null;
  hour12: boolean;
  step: number;
  disabled: boolean | undefined;
  /** The digits typed so far, and where. */
  typed: (seg: Segment) => string;
  type: (seg: Segment, text: string) => void;
  minuteRef: RefObject<HTMLSpanElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  put: (h: number, m: number) => void;
  bump: (seg: Segment, by: number) => void;
  to24: (shown: number) => number;
}

const TimeContext = createContext<TimeState | null>(null);

function useTime(part: string): TimeState {
  const state = useContext(TimeContext);
  if (!state) throw new Error(`${part} goes inside a TimePicker.`);
  return state;
}

/**
 * A time typed or chosen: two spinbuttons (arrows change, digits type, Backspace clears), AM or PM
 * in 12 hours, and a list of times every `step` minutes behind the clock. With children, they are
 * the parts: `TimePickerHour`, `TimePickerSeparator`, `TimePickerMinute`, `TimePickerPeriod`,
 * `TimePickerList`.
 */
export function TimePicker({
  label,
  value,
  defaultValue = null,
  onChange,
  hour12 = false,
  step = 15,
  disabled,
  id,
  className,
  children,
  ...aria
}: TimePickerProps | TimePickerRootProps) {
  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange,
  });
  const { open, setOpen } = useDisclosure();
  const t = parseTime(current);
  const buffer = useRef<{ seg: Segment; text: string }>({ seg: "hour", text: "" });
  const minuteRef = useRef<HTMLSpanElement>(null);

  const put = (h: number, m: number) => setCurrent(`${pad(h)}:${pad(m)}`);
  const afternoon = t ? t.h >= 12 : false;
  /** An hour in the clock the person reads, back to 24 hours. */
  const to24 = (shown: number) => (hour12 ? (shown % 12) + (afternoon ? 12 : 0) : shown);
  const bump = (seg: Segment, by: number) => {
    const h = t?.h ?? 0;
    const m = t?.m ?? 0;
    if (seg === "hour") put((h + by + 24) % 24, m);
    else put(h, (((m + by * step) % 60) + 60) % 60);
  };

  const state: TimeState = {
    label,
    current,
    setCurrent,
    t,
    hour12,
    step,
    disabled,
    typed: (seg) => (buffer.current.seg === seg ? buffer.current.text : ""),
    type: (seg, text) => {
      buffer.current = { seg, text };
    },
    minuteRef,
    open,
    setOpen,
    put,
    bump,
    to24,
  };

  return (
    <TimeContext.Provider value={state}>
      <div
        className={cx("fg-time", disabled && "fg-combo-disabled", className)}
        role="group"
        aria-label={label}
        id={id}
        {...aria}
      >
        {children ?? (
          <>
            <TimePickerHour />
            <TimePickerSeparator />
            <TimePickerMinute />
            {hour12 ? <TimePickerPeriod /> : null}
            <TimePickerList />
          </>
        )}
      </div>
    </TimeContext.Provider>
  );
}

type Part<T> = Omit<T, "className"> & { className?: string };

export type TimePickerSegmentProps = Part<
  Omit<ComponentProps<"span">, "children" | "onKeyDown" | "onFocus">
> & {
  segment: Segment;
};

/** One spinbutton of the clock: the hour or the minute. */
export function TimePickerSegment({ segment: seg, className, ...rest }: TimePickerSegmentProps) {
  const { label, t, hour12, disabled, typed, type, minuteRef, setCurrent, put, bump, to24 } =
    useTime("TimePickerSegment");
  const shown = !t ? null : seg === "hour" ? (hour12 ? t.h % 12 || 12 : t.h) : t.m;

  const onKey = (event: KeyboardEvent<HTMLSpanElement>) => {
    const key = event.key;
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      bump(seg, key === "ArrowUp" ? 1 : -1);
    } else if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      type(seg, "");
      setCurrent(null);
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      const top = key === "End";
      if (seg === "hour") put(top ? 23 : 0, t?.m ?? 0);
      else put(t?.h ?? 0, top ? 59 : 0);
    } else if (/^\d$/.test(key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const text = typed(seg) + key;
      const n = Number(text);
      if (seg === "hour") {
        const limit = hour12 ? 12 : 23;
        const first = hour12 ? 1 : 2;
        if (n > limit) {
          type(seg, key);
          const only = Number(key);
          put(to24(only), t?.m ?? 0);
          return;
        }
        put(to24(hour12 && n === 0 ? 12 : n), t?.m ?? 0);
        const done = text.length === 2 || n > first;
        if (done) type("minute", "");
        else type(seg, text);
        if (done) minuteRef.current?.focus();
      } else {
        if (n > 59) {
          type(seg, key);
          put(t?.h ?? 0, Number(key));
          return;
        }
        put(t?.h ?? 0, n);
        type(seg, text.length === 2 || n > 5 ? "" : text);
      }
    }
  };

  return (
    <span
      ref={seg === "minute" ? minuteRef : undefined}
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label}, ${seg === "hour" ? "hour" : "minute"}`}
      aria-valuemin={seg === "hour" ? (hour12 ? 1 : 0) : 0}
      aria-valuemax={seg === "hour" ? (hour12 ? 12 : 23) : 59}
      aria-valuenow={shown ?? undefined}
      aria-valuetext={shown === null ? "Empty" : pad(shown)}
      aria-disabled={disabled || undefined}
      {...rest}
      className={cx("fg-time-seg", className)}
      onKeyDown={disabled ? undefined : onKey}
      onFocus={() => type(seg, "")}
    >
      {shown === null ? "––" : pad(shown)}
    </span>
  );
}

export type TimePickerPartProps = Omit<TimePickerSegmentProps, "segment">;

export function TimePickerHour(props: TimePickerPartProps) {
  return <TimePickerSegment {...props} segment="hour" />;
}

export function TimePickerMinute(props: TimePickerPartProps) {
  return <TimePickerSegment {...props} segment="minute" />;
}

/** The colon between hour and minute. */
export function TimePickerSeparator({
  className,
  children,
  ...rest
}: Part<ComponentProps<"span">>) {
  return (
    <span aria-hidden="true" {...rest} className={cx("fg-time-colon", className)}>
      {children ?? ":"}
    </span>
  );
}

/** AM or PM, a button that switches it. Use it with `hour12`. */
export function TimePickerPeriod({
  className,
  ...rest
}: Part<Omit<ComponentProps<"button">, "children" | "onClick">>) {
  const { label, t, disabled, put } = useTime("TimePickerPeriod");
  const afternoon = t ? t.h >= 12 : false;
  return (
    <button
      type="button"
      disabled={disabled || !t}
      aria-label={`${label}, ${afternoon ? "PM" : "AM"}. Switch`}
      {...rest}
      className={cx("fg-time-period", className)}
      onClick={() => t && put((t.h + 12) % 24, t.m)}
    >
      {afternoon ? "PM" : "AM"}
    </button>
  );
}

export type TimePickerListProps = Part<Omit<ComponentProps<"button">, "children" | "onClick">>;

/** The button with the clock icon, and the list of times it opens, every `step` minutes. */
export function TimePickerList({ className, ...rest }: TimePickerListProps) {
  const { label, current, setCurrent, hour12, step, disabled, open, setOpen } =
    useTime("TimePickerList");
  const picked = useRef<HTMLButtonElement | null>(null);
  const times: string[] = [];
  const every = Math.max(1, Math.floor(step));
  for (let minutes = 0; minutes < 24 * 60; minutes += every) {
    times.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  const firstRow = times.includes(current ?? "") ? current : times[0];
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const rows = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
    const at = rows.indexOf(document.activeElement as HTMLButtonElement);
    const to: Record<string, number> = {
      ArrowDown: at + 1,
      ArrowUp: at - 1,
      Home: 0,
      End: rows.length - 1,
    };
    const next = to[event.key];
    if (next === undefined) return;
    event.preventDefault();
    rows[Math.min(rows.length - 1, Math.max(0, next))]?.focus();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={`${label}: choose from a list`}
        {...rest}
        className={cx("fg-time-open", className)}
      >
        <Icon icon={Time01Icon} size={12} variant="mono" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={4}
        className="fg-time-pop"
        aria-label={`${label}, times`}
        initialFocus={picked as RefObject<HTMLElement | null>}
      >
        <div className="fg-pop-list" role="listbox" aria-label={`${label}, times`} onKeyDown={move}>
          {times.map((time) => (
            <button
              key={time}
              ref={time === firstRow ? picked : undefined}
              type="button"
              role="option"
              aria-selected={time === current}
              tabIndex={time === firstRow ? 0 : -1}
              className="fg-pop-row"
              data-selected={time === current ? "" : undefined}
              onClick={() => {
                setCurrent(time);
                setOpen(false);
              }}
            >
              <span className="fg-pop-label">{formatTime(time, hour12)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------------------------------------------------- DateRangePicker */

export interface DateRange {
  /** `YYYY-MM-DD`, or null for none. */
  from: string | null;
  to: string | null;
}

export interface RangePreset {
  label: string;
  from: string;
  to: string;
}

const monthStart = (iso: string) => {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth(), 1));
};
const monthEnd = (iso: string) => {
  const d = parseIso(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

/** Today, the last 7 and 30 days, this month, last month: the quick picks of a range. */
export function rangePresets(today: string): RangePreset[] {
  const before = addMonths(monthStart(today), -1);
  return [
    { label: "Today", from: today, to: today },
    { label: "Last 7 days", from: addDays(today, -6), to: today },
    { label: "Last 30 days", from: addDays(today, -29), to: today },
    { label: "This month", from: monthStart(today), to: monthEnd(today) },
    { label: "Last month", from: monthStart(before), to: monthEnd(before) },
  ];
}

export interface DateRangePickerProps {
  /** Names the control, e.g. "Period". */
  label: string;
  value?: DateRange;
  defaultValue?: DateRange;
  /** Hears complete ranges only: the first click of a range waits for the second. */
  onChange?: (value: DateRange) => void;
  placeholder?: string;
  /** The quick picks above the month; `rangePresets(today)` by default, `[]` for none. */
  presets?: ReadonlyArray<RangePreset>;
  /** Offers to remove the range. Default `true`. */
  clearable?: boolean;
  /** `YYYY-MM-DD`; the device's date by default. */
  today?: string;
  /** Days before `min` or after `max` cannot be chosen. */
  min?: string;
  max?: string;
  /** `field` (default): a form control. `chip`: a property of a record. */
  variant?: "field" | "chip";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

/** The root of the composed range picker: no `label`, the parts as children. */
export interface DateRangePickerRootProps {
  label?: undefined;
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (value: DateRange) => void;
  today?: string;
  min?: string;
  max?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

const EMPTY: DateRange = { from: null, to: null };

interface RangeState {
  range: DateRange;
  anchor: string | null;
  today: string;
  year: number;
  min: string | undefined;
  max: string | undefined;
  /** The text of the range: its two days, or nothing. */
  text: string | null;
  apply: (next: DateRange) => void;
  choose: (iso: string) => void;
}

const RangeContext = createContext<RangeState | null>(null);

function useRange(part: string): RangeState {
  const state = useContext(RangeContext);
  if (!state) throw new Error(`${part} goes inside a DateRangePicker.`);
  return state;
}

/**
 * With `label`: a period, quick picks, then a month in which the first click sets the start and the
 * second the end (in either order), built on the Calendar. Without: the root of the parts
 * (`DateRangePickerTrigger`, `DateRangePickerContent`, `DateRangePickerPresets`,
 * `DateRangePickerCalendar`, `DateRangePickerFooter`).
 */
export function DateRangePicker(props: DateRangePickerProps | DateRangePickerRootProps) {
  return props.label !== undefined ? (
    <DateRangePickerField {...props} />
  ) : (
    <DateRangePickerRoot {...props} />
  );
}

function DateRangePickerRoot({
  value,
  defaultValue = EMPTY,
  onChange,
  today: todayProp,
  min,
  max,
  open: openProp,
  onOpenChange,
  children,
}: DateRangePickerRootProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const [range, setRange] = useControllableState<DateRange>({ value, defaultValue, onChange });
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [anchor, setAnchor] = useState<string | null>(null);
  const year = Number(today.slice(0, 4));
  const has = range.from !== null && range.to !== null;
  const text = has
    ? range.from === range.to
      ? formatShort(range.from!, year)
      : `${formatShort(range.from!, year)} → ${formatShort(range.to!, year)}`
    : null;

  const apply = (next: DateRange) => {
    setRange(next);
    setAnchor(null);
    setOpen(false);
  };
  const choose = (iso: string) => {
    if (anchor === null) {
      setAnchor(iso);
      return;
    }
    apply(iso < anchor ? { from: iso, to: anchor } : { from: anchor, to: iso });
  };

  return (
    <RangeContext.Provider value={{ range, anchor, today, year, min, max, text, apply, choose }}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setAnchor(null);
        }}
      >
        {children}
      </Popover>
    </RangeContext.Provider>
  );
}

export interface DateRangePickerTriggerProps {
  /** Names the control, e.g. "Period". */
  label: string;
  placeholder?: string;
  /** `field` (default): a form control. `chip`: a property of a record. */
  variant?: "field" | "chip";
  disabled?: boolean;
  /** Drawn in place of the range. */
  children?: ReactNode;
  className?: string;
}

/** The field or chip that shows the range and opens the picker. */
export function DateRangePickerTrigger({
  label,
  placeholder = "Choose dates",
  variant = "field",
  disabled,
  children,
  className,
}: DateRangePickerTriggerProps) {
  const { text } = useRange("DateRangePickerTrigger");
  return (
    <PopoverTrigger
      disabled={disabled}
      className={cx(
        "fg-selm-trigger fg-range-trigger",
        variant === "chip" && "fg-selm-chip",
        text === null && "fg-selm-empty",
        className,
      )}
      aria-label={text !== null ? `${label}: ${text}` : label}
    >
      {children ?? (
        <>
          <Icon icon={Calendar03Icon} size={12} variant="mono" />
          <span>{text ?? placeholder}</span>
        </>
      )}
    </PopoverTrigger>
  );
}

export interface DateRangePickerContentProps {
  /** Names the panel, e.g. "Period". */
  label: string;
  children?: ReactNode;
  className?: string;
}

/** The panel under the trigger: presets, the month, the footer. */
export function DateRangePickerContent({
  label,
  children,
  className,
}: DateRangePickerContentProps) {
  return (
    <PopoverContent
      side="bottom"
      align="start"
      sideOffset={4}
      aria-label={label}
      className={cx("fg-datepop fg-range-pop", className)}
    >
      {children}
    </PopoverContent>
  );
}

export interface DateRangePickerPresetsProps {
  /** `rangePresets(today)` by default, `[]` for none. */
  presets?: ReadonlyArray<RangePreset>;
  className?: string;
}

/** The quick picks: a chip each, choosing one applies the range. */
export function DateRangePickerPresets({ presets, className }: DateRangePickerPresetsProps) {
  const { today, apply } = useRange("DateRangePickerPresets");
  const picks = presets ?? rangePresets(today);
  if (picks.length === 0) return null;
  return (
    <div className={cx("fg-range-presets", className)}>
      {picks.map((p) => (
        <button
          key={p.label}
          type="button"
          className="fg-range-preset"
          onClick={() => apply({ from: p.from, to: p.to })}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export type DateRangePickerCalendarProps = Omit<
  CalendarProps,
  "value" | "onChange" | "today" | "range" | "children" | "min" | "max"
>;

/** The month: the first click sets one end, the second the other. */
export function DateRangePickerCalendar(props: DateRangePickerCalendarProps) {
  const { range, anchor, today, min, max, choose } = useRange("DateRangePickerCalendar");
  return (
    <Calendar
      {...props}
      today={today}
      range={anchor !== null ? { from: anchor, to: null } : range}
      defaultMonth={anchor ?? range.from ?? today}
      {...(min ? { min } : {})}
      {...(max ? { max } : {})}
      onChange={choose}
    />
  );
}

export interface DateRangePickerFooterProps {
  /** Offers to remove the range. Default `true`. */
  clearable?: boolean;
  className?: string;
}

/** What the range is, or what to choose next, and the Clear button. */
export function DateRangePickerFooter({ clearable = true, className }: DateRangePickerFooterProps) {
  const { range, anchor, year, text, apply } = useRange("DateRangePickerFooter");
  const has = range.from !== null && range.to !== null;
  return (
    <div className={cx("fg-range-foot", className)}>
      <span className="fg-range-state" aria-live="polite">
        {anchor !== null
          ? `From ${formatShort(anchor, year)}: choose the end`
          : has
            ? text
            : "Choose the first day"}
      </span>
      {clearable && (has || anchor !== null) ? (
        <button
          type="button"
          className="fg-range-preset"
          onClick={() => apply({ from: null, to: null })}
        >
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
          Clear
        </button>
      ) : null}
    </div>
  );
}

function DateRangePickerField({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  presets,
  clearable = true,
  today,
  min,
  max,
  variant,
  open,
  onOpenChange,
  disabled,
  className,
  children,
}: DateRangePickerProps) {
  return (
    <DateRangePickerRoot
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onChange ? { onChange } : {})}
      {...(today ? { today } : {})}
      {...(min ? { min } : {})}
      {...(max ? { max } : {})}
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <DateRangePickerTrigger
        label={label}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(variant ? { variant } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(className ? { className } : {})}
      >
        {children}
      </DateRangePickerTrigger>
      <DateRangePickerContent label={label}>
        <DateRangePickerPresets {...(presets ? { presets } : {})} />
        <DateRangePickerCalendar label={label} />
        <DateRangePickerFooter clearable={clearable} />
      </DateRangePickerContent>
    </DateRangePickerRoot>
  );
}
