// A time of day (TimePicker) and a span of days (DateRangePicker). Times travel as `HH:mm` in 24
// hours, days as `YYYY-MM-DD`, both without a time zone, like the Calendar.

import { Popover } from "@base-ui/react/popover";
import { Calendar03Icon, Cancel01Icon, Time01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { Calendar } from "./calendar";
import { cx } from "./cx";
import { addDays, addMonths, formatShort, parseIso, toIso } from "./dates";
import { useControllableState } from "./hooks/use-controllable";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";

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
}

type Segment = "hour" | "minute";

/**
 * A time typed or chosen: two spinbuttons (arrows change, digits type, Backspace clears), AM or PM
 * in 12 hours, and a list of times every `step` minutes behind the clock.
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
  ...aria
}: TimePickerProps) {
  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange,
  });
  const { open, setOpen } = useDisclosure();
  const t = parseTime(current);
  const buffer = useRef<{ seg: Segment; text: string }>({ seg: "hour", text: "" });
  const minuteRef = useRef<HTMLSpanElement>(null);
  const picked = useRef<HTMLButtonElement | null>(null);

  const put = (h: number, m: number) => setCurrent(`${pad(h)}:${pad(m)}`);
  const hourShown = t ? (hour12 ? t.h % 12 || 12 : t.h) : null;
  const afternoon = t ? t.h >= 12 : false;
  /** An hour in the clock the person reads, back to 24 hours. */
  const to24 = (shown: number) => (hour12 ? (shown % 12) + (afternoon ? 12 : 0) : shown);

  const bump = (seg: Segment, by: number) => {
    const h = t?.h ?? 0;
    const m = t?.m ?? 0;
    if (seg === "hour") put((h + by + 24) % 24, m);
    else put(h, (((m + by * step) % 60) + 60) % 60);
  };

  const onKey = (seg: Segment) => (event: KeyboardEvent<HTMLSpanElement>) => {
    const key = event.key;
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      bump(seg, key === "ArrowUp" ? 1 : -1);
    } else if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      buffer.current = { seg, text: "" };
      setCurrent(null);
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      const top = key === "End";
      if (seg === "hour") put(top ? 23 : 0, t?.m ?? 0);
      else put(t?.h ?? 0, top ? 59 : 0);
    } else if (/^\d$/.test(key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const text = (buffer.current.seg === seg ? buffer.current.text : "") + key;
      const n = Number(text);
      if (seg === "hour") {
        const limit = hour12 ? 12 : 23;
        const first = hour12 ? 1 : 2;
        if (n > limit) {
          buffer.current = { seg, text: key };
          const only = Number(key);
          put(to24(only), t?.m ?? 0);
          return;
        }
        put(to24(hour12 && n === 0 ? 12 : n), t?.m ?? 0);
        const done = text.length === 2 || n > first;
        buffer.current = done ? { seg: "minute", text: "" } : { seg, text };
        if (done) minuteRef.current?.focus();
      } else {
        if (n > 59) {
          buffer.current = { seg, text: key };
          put(t?.h ?? 0, Number(key));
          return;
        }
        put(t?.h ?? 0, n);
        buffer.current = text.length === 2 || n > 5 ? { seg, text: "" } : { seg, text };
      }
    }
  };

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

  const segment = (seg: Segment, shown: number | null) => (
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
      className="fg-time-seg"
      onKeyDown={disabled ? undefined : onKey(seg)}
      onFocus={() => (buffer.current = { seg, text: "" })}
    >
      {shown === null ? "––" : pad(shown)}
    </span>
  );

  return (
    <div
      className={cx("fg-time", disabled && "fg-combo-disabled", className)}
      role="group"
      aria-label={label}
      id={id}
      {...aria}
    >
      {segment("hour", hourShown)}
      <span className="fg-time-colon" aria-hidden="true">
        :
      </span>
      {segment("minute", t ? t.m : null)}
      {hour12 ? (
        <button
          type="button"
          className="fg-time-period"
          disabled={disabled || !t}
          aria-label={`${label}, ${afternoon ? "PM" : "AM"}. Switch`}
          onClick={() => t && put((t.h + 12) % 24, t.m)}
        >
          {afternoon ? "PM" : "AM"}
        </button>
      ) : null}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          className="fg-time-open"
          disabled={disabled}
          aria-label={`${label}: choose from a list`}
        >
          <Icon icon={Time01Icon} size={12} variant="mono" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="end">
            <Popover.Popup
              className="fg-pop fg-time-pop"
              aria-label={`${label}, times`}
              initialFocus={picked as RefObject<HTMLElement | null>}
            >
              <div
                className="fg-pop-list"
                role="listbox"
                aria-label={`${label}, times`}
                onKeyDown={move}
              >
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
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
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

const EMPTY: DateRange = { from: null, to: null };

/**
 * A period: quick picks, then a month in which the first click sets the start and the second the
 * end (in either order). Built on the Calendar, so arrows, Page keys and Enter work.
 */
export function DateRangePicker({
  label,
  value,
  defaultValue = EMPTY,
  onChange,
  placeholder = "Choose dates",
  presets,
  clearable = true,
  today: todayProp,
  min,
  max,
  variant = "field",
  open: openProp,
  onOpenChange,
  disabled,
  className,
  children,
}: DateRangePickerProps) {
  const [deviceToday] = useState(() => toIso(new Date()));
  const today = todayProp ?? deviceToday;
  const [range, setRange] = useControllableState<DateRange>({ value, defaultValue, onChange });
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [anchor, setAnchor] = useState<string | null>(null);
  const picks = presets ?? rangePresets(today);
  const year = Number(today.slice(0, 4));
  const has = range.from !== null && range.to !== null;
  const text = has
    ? range.from === range.to
      ? formatShort(range.from!, year)
      : `${formatShort(range.from!, year)} → ${formatShort(range.to!, year)}`
    : placeholder;

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
  const shown = anchor !== null ? { from: anchor, to: null } : range;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setAnchor(null);
      }}
    >
      <Popover.Trigger
        disabled={disabled}
        className={cx(
          "fg-selm-trigger fg-range-trigger",
          variant === "chip" && "fg-selm-chip",
          !has && "fg-selm-empty",
          className,
        )}
        aria-label={has ? `${label}: ${text}` : label}
      >
        {children ?? (
          <>
            <Icon icon={Calendar03Icon} size={12} variant="mono" />
            <span>{text}</span>
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
          <Popover.Popup className="fg-pop fg-datepop fg-range-pop" aria-label={label}>
            {picks.length > 0 ? (
              <div className="fg-range-presets">
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
            ) : null}
            <Calendar
              label={label}
              today={today}
              range={shown}
              defaultMonth={anchor ?? range.from ?? today}
              {...(min ? { min } : {})}
              {...(max ? { max } : {})}
              onChange={choose}
            />
            <div className="fg-range-foot">
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
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
