// A day, then a time: the picker of a booking page, after the booking of the Agenda prototype. A
// strip of days (or a month) shows how many slots each day has; the slots of the day follow, in
// the viewer's time zone; taken and past slots stay in the list, struck and not selectable.

import { ArrowLeft01Icon, ArrowRight01Icon, Globe02Icon } from "@forgeron/icons";
import { useMemo, type KeyboardEvent } from "react";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { cx } from "../cx";
import { addDays, formatLong, formatShort, parseIso, WEEKDAYS, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { formatTime } from "../time";
import { TimezonePicker } from "../timezone-picker";
import {
  daySlots,
  formatMinutes,
  formatOffset,
  fromMinutes,
  slotsOnDay,
  timezoneOffset,
  toMinutes,
  zonedToUtc,
  type Availability,
  type BusyBlock,
  type SlotItem,
  type TimeSlot,
} from "./time-model";

/** The slot chosen: the day and time in the zone shown, and the same moment in the host's zone. */
export interface SlotChoice {
  date: string;
  time: string;
  timezone: string;
  /** The length in minutes. */
  duration: number;
  host: { date: string; time: string; timezone: string };
}

export interface SlotPickerProps {
  /** The slot chosen, or null. */
  value?: SlotChoice | null;
  defaultValue?: SlotChoice | null;
  onChange?: (value: SlotChoice | null) => void;
  /** Slots given as they are, in the host's zone; they take the place of `availability`. */
  slots?: ReadonlyArray<TimeSlot>;
  /** Hours to compute the slots from, with `busy`, `duration` and `interval`. */
  availability?: Availability;
  /** Time already taken, in the host's zone: it blocks the slots that overlap it. */
  busy?: ReadonlyArray<BusyBlock>;
  /** Length of the visit in minutes. Default 30. */
  duration?: number;
  /** Minutes between two starts when computed from `availability`. Default: the duration. */
  interval?: number;
  /** The zone the slots are written in; `availability.timezone`, else the zone shown. */
  hostTimezone?: string;
  /** The zone the person sees; `timezone` is controlled with `onTimezoneChange`. */
  timezone?: string;
  defaultTimezone?: string;
  onTimezoneChange?: (timezone: string) => void;
  /** Lets the person change the zone. Default `true` when `onTimezoneChange` or a default is given. */
  timezonePicker?: boolean;
  /** `strip`: a row of days. `calendar`: a month beside the slots. */
  layout?: "strip" | "calendar";
  /** The day shown, `YYYY-MM-DD`. */
  date?: string;
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  /** Days in the strip. Default 7. */
  days?: number;
  /** The local moment, `YYYY-MM-DDTHH:mm`, in the zone shown: earlier slots are past. */
  now?: string;
  /** The last day that can be booked, `YYYY-MM-DD`. */
  max?: string;
  hour12?: boolean;
  /** Shows the taken and past slots, struck. Default `true`. */
  showUnavailable?: boolean;
  /** Text of a confirm button under the slots; it calls `onConfirm`. */
  confirmLabel?: string;
  onConfirm?: (choice: SlotChoice) => void;
  className?: string;
}

/** The slot list of a day for a zone, from explicit slots or from hours. */
function useDaySlots(
  date: string,
  props: Pick<SlotPickerProps, "slots" | "availability" | "busy">,
  host: string,
  zone: string,
  duration: number,
  interval: number,
  now: string | undefined,
): SlotItem[] {
  const { slots, availability, busy } = props;
  return useMemo(() => {
    const source: TimeSlot[] =
      slots !== undefined
        ? [...slots]
        : availability
          ? [-1, 0, 1].flatMap((d) =>
              daySlots(addDays(date, d), availability, busy ?? [], duration, interval),
            )
          : [];
    return slotsOnDay(date, source, host, zone, now);
  }, [slots, availability, busy, date, host, zone, duration, interval, now]);
}

/**
 * Choose a day, then a time. Arrows move among the days and among the slots; the zone is shown
 * with its offset and can be changed, in which case the slots are moved to it.
 */
export function SlotPicker(props: SlotPickerProps) {
  const {
    value,
    defaultValue = null,
    onChange,
    slots,
    availability,
    busy,
    duration = 30,
    interval,
    hostTimezone,
    timezone: zoneProp,
    defaultTimezone,
    onTimezoneChange,
    timezonePicker,
    layout = "strip",
    date: dateProp,
    defaultDate,
    onDateChange,
    days = 7,
    now,
    max,
    hour12 = false,
    showUnavailable = true,
    confirmLabel,
    onConfirm,
    className,
  } = props;
  const today = now?.slice(0, 10);
  const host = hostTimezone ?? availability?.timezone ?? zoneProp ?? defaultTimezone ?? "UTC";
  const [zone, setZone] = useControllableState<string>({
    value: zoneProp,
    defaultValue: defaultTimezone ?? host,
    onChange: onTimezoneChange,
  });
  const [chosen, setChosen] = useControllableState<SlotChoice | null>({
    value,
    defaultValue,
    onChange,
  });
  const [date, setDate] = useControllableState<string>({
    value: dateProp,
    defaultValue: defaultDate ?? today ?? "1970-01-01",
    onChange: onDateChange,
  });
  const step = interval ?? duration;

  const list = useDaySlots(date, props, host, zone, duration, step, now);
  // The strip starts at the first day of the week of `date`, three days back at most.
  const start = addDays(date, -Math.min(weekday(date), 3));
  const stripDays = Array.from({ length: Math.max(1, days) }, (_, i) => addDays(start, i));

  const countFor = (day: string) => {
    if (max !== undefined && day > max) return -1;
    const free = (day === date ? list : slotsFor(day)).filter((s) => s.available).length;
    return free;
  };
  const slotsFor = (day: string): SlotItem[] => {
    const source: TimeSlot[] =
      slots !== undefined
        ? [...slots]
        : availability
          ? [-1, 0, 1].flatMap((d) =>
              daySlots(addDays(day, d), availability, busy ?? [], duration, step),
            )
          : [];
    return slotsOnDay(day, source, host, zone, now);
  };

  const offset = formatOffset(timezoneOffset(zone, zonedToUtc(date, "12:00", zone)));
  const shown = showUnavailable ? list : list.filter((s) => s.available);
  const pick = (s: SlotItem) => {
    if (!s.available) return;
    const next: SlotChoice = {
      date: s.date,
      time: s.time,
      timezone: zone,
      duration,
      host: s.host,
    };
    setChosen(chosen && chosen.date === s.date && chosen.time === s.time ? null : next);
  };

  const onSlotKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-slot]")];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const perRow = 3;
    const to: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: at + perRow,
      ArrowUp: at - perRow,
      Home: 0,
      End: items.length - 1,
    };
    const next = to[event.key];
    if (next === undefined || at === -1) return;
    event.preventDefault();
    items[Math.min(items.length - 1, Math.max(0, next))]?.focus();
  };

  const onDayKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const by: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    const delta = by[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = addDays(date, delta);
    if (max !== undefined && next > max) return;
    setDate(next);
    requestAnimationFrame(() =>
      event.currentTarget.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus(),
    );
  };

  const selectedHere = chosen && chosen.date === date ? chosen : null;
  const hasPicker =
    timezonePicker ?? (onTimezoneChange !== undefined || defaultTimezone !== undefined);
  const first = shown.find((s) => s.available);
  const rovingTarget = selectedHere?.time ?? first?.time;

  return (
    <div className={cx("fg-slot", layout === "calendar" && "fg-slot-calendar", className)}>
      <div className="fg-slot-head">
        <span className="fg-slot-duration">{formatMinutes(duration)}</span>
        <span className="fg-slot-zone">
          <Icon icon={Globe02Icon} size={12} variant="mono" />
          {hasPicker ? (
            <TimezonePicker
              label="Time zone"
              value={zone}
              hour12={hour12}
              onChange={(z) => z && setZone(z)}
            />
          ) : (
            <span>
              {zone} <span className="fg-slot-offset">{offset}</span>
            </span>
          )}
        </span>
      </div>
      <div className="fg-slot-body">
        {layout === "calendar" ? (
          <Calendar
            label="Day"
            value={date}
            {...(today ? { today } : {})}
            {...(today ? { min: today } : {})}
            {...(max ? { max } : {})}
            onChange={setDate}
          />
        ) : (
          <div className="fg-slot-strip-wrap">
            <IconButton
              icon={ArrowLeft01Icon}
              size="sm"
              label="Previous days"
              onClick={() => setDate(addDays(date, -days))}
            />
            <div className="fg-slot-strip" role="group" aria-label="Days" onKeyDown={onDayKeys}>
              {stripDays.map((d) => {
                const n = countFor(d);
                const off = n <= 0 || (today !== undefined && d < today);
                return (
                  <button
                    key={d}
                    type="button"
                    data-day={d}
                    className={cx("fg-slot-day", d === date && "fg-slot-day-on")}
                    aria-pressed={d === date}
                    aria-label={`${formatLong(d)}, ${n < 0 ? "closed" : n === 0 ? "no slots" : `${n} ${n === 1 ? "slot" : "slots"}`}`}
                    data-empty={off ? "" : undefined}
                    disabled={n < 0}
                    onClick={() => setDate(d)}
                  >
                    <span className="fg-slot-dow">{WEEKDAYS[weekday(d)]!.slice(0, 3)}</span>
                    <span className="fg-slot-num">{parseIso(d).getDate()}</span>
                    <span className="fg-slot-count">{n < 0 ? "–" : n === 0 ? "Full" : n}</span>
                  </button>
                );
              })}
            </div>
            <IconButton
              icon={ArrowRight01Icon}
              size="sm"
              label="Next days"
              onClick={() => setDate(addDays(date, days))}
            />
          </div>
        )}
        <div className="fg-slot-times">
          <h3 className="fg-slot-title" aria-live="polite">
            {formatShort(date)}
            <span className="fg-slot-offset"> · {WEEKDAYS[weekday(date)]}</span>
          </h3>
          {shown.length === 0 ? (
            <p className="fg-slot-none">No time is available this day.</p>
          ) : (
            <div
              className="fg-slot-list"
              role="listbox"
              aria-label={`Times on ${formatLong(date)}`}
              onKeyDown={onSlotKeys}
            >
              {shown.map((s) => {
                const on = selectedHere?.time === s.time;
                return (
                  <button
                    key={`${s.host.date}${s.host.time}`}
                    type="button"
                    role="option"
                    data-slot={s.time}
                    className={cx(
                      "fg-slot-time",
                      on && "fg-slot-time-on",
                      !s.available && "fg-slot-gone",
                    )}
                    aria-selected={on}
                    aria-disabled={!s.available || undefined}
                    tabIndex={s.time === rovingTarget ? 0 : -1}
                    aria-label={`${formatTime(s.time, hour12)}${!s.available ? (s.reason === "past" ? ", past" : ", taken") : ""}`}
                    onClick={() => pick(s)}
                  >
                    {formatTime(s.time, hour12)}
                  </button>
                );
              })}
            </div>
          )}
          {selectedHere ? (
            <p className="fg-slot-summary" aria-live="polite">
              {formatLong(selectedHere.date)}, {formatTime(selectedHere.time, hour12)} –{" "}
              {formatTime(fromMinutes((toMinutes(selectedHere.time) ?? 0) + duration), hour12)} (
              {zone}, {offset})
            </p>
          ) : null}
          {confirmLabel && onConfirm ? (
            <Button
              variant="primary"
              disabled={!selectedHere}
              onClick={() => selectedHere && onConfirm(selectedHere)}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
