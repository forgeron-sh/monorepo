// A day, then a time: the picker of a booking page, after the booking of the Agenda prototype. A
// strip of days (or a month) shows how many slots each day has; the slots of the day follow, in
// the viewer's time zone; taken and past slots stay in the list, struck and not selectable.
//
// The list of times is the `SlotList` primitive and the month is the `Calendar`. Two ways to use
// it. With props it is the whole picker. With children it is the root of the parts:
//
//   <SlotPicker availability={hours} duration={30}>
//     <SlotPickerHeader />
//     <SlotPickerBody>
//       <SlotPickerDays />
//       <SlotPickerTimes />
//     </SlotPickerBody>
//   </SlotPicker>
//
// `SlotPickerHeader` is the length and the zone (`SlotPickerDuration`, `SlotPickerZone`);
// `SlotPickerDays` is the strip (`SlotPickerStrip` of `SlotPickerDay`) or the month
// (`SlotPickerCalendar`); `SlotPickerTimes` is the day's title, the list, the summary and the
// confirm button (`SlotPickerTitle`, `SlotPickerList`, `SlotPickerSummary`, `SlotPickerConfirm`).

import { Globe02Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { cx } from "../cx";
import { addDays, formatLong, formatShort, parseIso, WEEKDAYS, weekday } from "../dates";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { PeriodNavNext, PeriodNavPrevious } from "../period-nav";
import { renderPart, type Part } from "../part";
import { SlotList, SlotListEmpty, type SlotListOption } from "../slot-list";
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

interface SlotPickerBase {
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
}

type RootAttrs = Omit<Part<ComponentProps<"div">>, "children" | "onChange" | "defaultValue"> & {
  asChild?: boolean;
};

export interface SlotPickerProps extends SlotPickerBase, RootAttrs {
  /** Given, `SlotPicker` is the root of the parts. */
  children?: undefined;
}

export interface SlotPickerRootProps extends SlotPickerBase, RootAttrs {
  children: ReactNode;
}

/** The slots of a day in a zone, from explicit slots or computed from hours (a day either side). */
function slotsForDay(
  day: string,
  props: Pick<SlotPickerBase, "slots" | "availability" | "busy">,
  host: string,
  zone: string,
  duration: number,
  interval: number,
  now: string | undefined,
): SlotItem[] {
  const { slots, availability, busy } = props;
  const source: TimeSlot[] =
    slots !== undefined
      ? [...slots]
      : availability
        ? [-1, 0, 1].flatMap((d) =>
            daySlots(addDays(day, d), availability, busy ?? [], duration, interval),
          )
        : [];
  return slotsOnDay(day, source, host, zone, now);
}

interface SlotPickerState {
  date: string;
  setDate: (date: string) => void;
  zone: string;
  setZone: (zone: string) => void;
  /** The offset of the zone shown: "+01:00". */
  offset: string;
  today: string | undefined;
  max: string | undefined;
  layout: "strip" | "calendar";
  /** Days in the strip. */
  span: number;
  duration: number;
  hour12: boolean;
  showUnavailable: boolean;
  zonePicker: boolean;
  /** The slots of the day, free or not. */
  slots: SlotItem[];
  /** The slot chosen, when it is on the day shown. */
  chosen: SlotChoice | null;
  /** Picks a slot, or drops it when it is the one chosen. */
  pick: (slot: SlotItem) => void;
  /** How many free slots a day has; -1 when the day is past `max`. */
  countFor: (day: string) => number;
  confirmLabel: string | undefined;
  confirm: ((choice: SlotChoice) => void) | undefined;
}

const SlotPickerContext = createContext<SlotPickerState | null>(null);

/** The state of the `SlotPicker` a part sits in: the day, the zone, the slots and the choice. */
export function useSlotPicker(part = "useSlotPicker"): SlotPickerState {
  const state = useContext(SlotPickerContext);
  if (!state) throw new Error(`${part} goes inside a SlotPicker.`);
  return state;
}

/**
 * Choose a day, then a time. Arrows move among the days and among the slots; the zone is shown
 * with its offset and can be changed, in which case the slots are moved to it.
 */
export function SlotPicker(props: SlotPickerProps | SlotPickerRootProps) {
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
    asChild,
    children,
    ...rest
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

  const list = useMemo(
    () => slotsForDay(date, { slots, availability, busy }, host, zone, duration, step, now),
    [slots, availability, busy, date, host, zone, duration, step, now],
  );

  const state: SlotPickerState = {
    date,
    setDate,
    zone,
    setZone,
    offset: formatOffset(timezoneOffset(zone, zonedToUtc(date, "12:00", zone))),
    today,
    max,
    layout,
    span: Math.max(1, days),
    duration,
    hour12,
    showUnavailable,
    zonePicker: timezonePicker ?? (onTimezoneChange !== undefined || defaultTimezone !== undefined),
    slots: list,
    chosen: chosen && chosen.date === date ? chosen : null,
    pick: (s) => {
      if (!s.available) return;
      const next: SlotChoice = {
        date: s.date,
        time: s.time,
        timezone: zone,
        duration,
        host: s.host,
      };
      setChosen(chosen && chosen.date === s.date && chosen.time === s.time ? null : next);
    },
    countFor: (day) => {
      if (max !== undefined && day > max) return -1;
      return (
        day === date
          ? list
          : slotsForDay(day, { slots, availability, busy }, host, zone, duration, step, now)
      ).filter((s) => s.available).length;
    },
    confirmLabel,
    confirm: onConfirm,
  };

  return (
    <SlotPickerContext.Provider value={state}>
      {renderPart(
        "div",
        cx("fg-slot", layout === "calendar" && "fg-slot-calendar", className),
        asChild,
        {
          "data-slot": "slot-picker",
          ...rest,
          children: children ?? (
            <>
              <SlotPickerHeader />
              <SlotPickerBody />
            </>
          ),
        },
      )}
    </SlotPickerContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** The length of the visit and the zone. */
export function SlotPickerHeader({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-slot-head", className), asChild, {
    "data-slot": "slot-picker-header",
    ...rest,
    children: children ?? (
      <>
        <SlotPickerDuration />
        <SlotPickerZone />
      </>
    ),
  });
}

/** "30 min": the length of the visit. */
export function SlotPickerDuration({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"span">>) {
  const g = useSlotPicker("SlotPickerDuration");
  return renderPart("span", cx("fg-slot-duration", className), asChild, {
    "data-slot": "slot-picker-duration",
    ...rest,
    children: children ?? formatMinutes(g.duration),
  });
}

/** The zone shown, with its offset; a picker when the person may change it. */
export function SlotPickerZone({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"span">>) {
  const g = useSlotPicker("SlotPickerZone");
  return renderPart("span", cx("fg-slot-zone", className), asChild, {
    "data-slot": "slot-picker-zone",
    ...rest,
    children: (
      <>
        <Icon icon={Globe02Icon} size={12} variant="mono" />
        {children ??
          (g.zonePicker ? (
            <TimezonePicker
              label="Time zone"
              value={g.zone}
              hour12={g.hour12}
              onChange={(z) => z && g.setZone(z)}
            />
          ) : (
            <span>
              {g.zone} <span className="fg-slot-offset">{g.offset}</span>
            </span>
          ))}
      </>
    ),
  });
}

/** The days and the times, one under the other (beside each other with a month). */
export function SlotPickerBody({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-slot-body", className), asChild, {
    "data-slot": "slot-picker-body",
    ...rest,
    children: children ?? (
      <>
        <SlotPickerDays />
        <SlotPickerTimes />
      </>
    ),
  });
}

/** The days to choose from: the strip, or the month, by the picker's `layout`. */
export function SlotPickerDays() {
  const g = useSlotPicker("SlotPickerDays");
  return g.layout === "calendar" ? <SlotPickerCalendar /> : <SlotPickerStrip />;
}

/** The month: the `Calendar` primitive, on the day shown. */
export function SlotPickerCalendar(
  props: Omit<ComponentProps<typeof Calendar>, "value" | "onChange" | "children">,
) {
  const g = useSlotPicker("SlotPickerCalendar");
  return (
    <Calendar
      label="Day"
      {...(g.today ? { today: g.today, min: g.today } : {})}
      {...(g.max ? { max: g.max } : {})}
      {...props}
      value={g.date}
      onChange={g.setDate}
    />
  );
}

/** A row of days, with the arrows that page through them. Arrows move among the days. */
export function SlotPickerStrip({
  className,
  children,
  ...rest
}: Omit<Part<ComponentProps<"div">>, "onKeyDown">) {
  const g = useSlotPicker("SlotPickerStrip");
  const start = addDays(g.date, -Math.min(weekday(g.date), 3));
  const stripDays = Array.from({ length: g.span }, (_, i) => addDays(start, i));
  const onDayKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = addDays(g.date, delta);
    if (g.max !== undefined && next > g.max) return;
    g.setDate(next);
    requestAnimationFrame(() =>
      event.currentTarget.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus(),
    );
  };
  return (
    <div className="fg-slot-strip-wrap" data-slot="slot-picker-strip">
      <PeriodNavPrevious
        label="Previous days"
        onClick={() => g.setDate(addDays(g.date, -g.span))}
      />
      <div
        role="group"
        aria-label="Days"
        {...rest}
        className={cx("fg-slot-strip", className)}
        onKeyDown={onDayKeys}
      >
        {children ?? stripDays.map((d) => <SlotPickerDay key={d} day={d} />)}
      </div>
      <PeriodNavNext label="Next days" onClick={() => g.setDate(addDays(g.date, g.span))} />
    </div>
  );
}

export interface SlotPickerDayProps extends Omit<Parted<ComponentProps<"button">>, "children"> {
  /** `YYYY-MM-DD`. */
  day: string;
  /** Its content; the weekday, the number and how many slots it has by default. */
  children?: ReactNode;
}

/** One day of the strip: pressed when it is the one shown, with the count of its free slots. */
export function SlotPickerDay({
  day,
  className,
  asChild,
  children,
  onClick,
  ...rest
}: SlotPickerDayProps) {
  const g = useSlotPicker("SlotPickerDay");
  const n = g.countFor(day);
  const off = n <= 0 || (g.today !== undefined && day < g.today);
  return renderPart(
    "button",
    cx("fg-slot-day", day === g.date && "fg-slot-day-on", className),
    asChild,
    {
      "data-slot": "slot-picker-day",
      type: "button",
      "data-day": day,
      "aria-pressed": day === g.date,
      "aria-label": `${formatLong(day)}, ${n < 0 ? "closed" : n === 0 ? "no slots" : `${n} ${n === 1 ? "slot" : "slots"}`}`,
      "data-empty": off ? "" : undefined,
      disabled: n < 0,
      ...rest,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) g.setDate(day);
      },
      children: children ?? (
        <>
          <span className="fg-slot-dow">{WEEKDAYS[weekday(day)]!.slice(0, 3)}</span>
          <span className="fg-slot-num">{parseIso(day).getDate()}</span>
          <span className="fg-slot-count">{n < 0 ? "–" : n === 0 ? "Full" : n}</span>
        </>
      ),
    },
  );
}

/** The day's title, its list of times, the summary of the choice and the confirm button. */
export function SlotPickerTimes({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  return renderPart("div", cx("fg-slot-times", className), asChild, {
    "data-slot": "slot-picker-times",
    ...rest,
    children: children ?? (
      <>
        <SlotPickerTitle />
        <SlotPickerList />
        <SlotPickerSummary />
        <SlotPickerConfirm />
      </>
    ),
  });
}

/** "Nov 18 · Wednesday": the day whose times are listed. */
export function SlotPickerTitle({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"h3">>) {
  const g = useSlotPicker("SlotPickerTitle");
  return renderPart("h3", cx("fg-slot-title", className), asChild, {
    "data-slot": "slot-picker-title",
    "aria-live": "polite",
    ...rest,
    children: children ?? (
      <>
        {formatShort(g.date)}
        <span className="fg-slot-offset"> · {WEEKDAYS[weekday(g.date)]}</span>
      </>
    ),
  });
}

/** The times of the day: a `SlotList`; the taken and past ones stay in, struck. */
export function SlotPickerList({
  className,
  ...rest
}: Omit<ComponentProps<typeof SlotList>, "items" | "children" | "value" | "onValueChange">) {
  const g = useSlotPicker("SlotPickerList");
  const shown = g.showUnavailable ? g.slots : g.slots.filter((s) => s.available);
  if (shown.length === 0) {
    return <SlotListEmpty className="fg-slot-none">No time is available this day.</SlotListEmpty>;
  }
  const items: SlotListOption[] = shown.map((s) => ({
    value: s.time,
    label: formatTime(s.time, g.hour12),
    ariaLabel: `${formatTime(s.time, g.hour12)}${!s.available ? (s.reason === "past" ? ", past" : ", taken") : ""}`,
    ...(s.available ? {} : { disabled: true }),
  }));
  return (
    <SlotList
      label={`Times on ${formatLong(g.date)}`}
      {...rest}
      className={cx("fg-slot-list", className)}
      items={items}
      value={g.chosen?.time ?? null}
      onValueChange={(time) => {
        const s = shown.find((x) => x.time === time);
        if (s) g.pick(s);
      }}
    />
  );
}

/** "Wed, Nov 18, 10:00 – 11:00 (Europe/Paris, +01:00)": what is chosen; nothing before a choice. */
export function SlotPickerSummary({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"p">>) {
  const g = useSlotPicker("SlotPickerSummary");
  const c = g.chosen;
  if (!c) return null;
  return renderPart("p", cx("fg-slot-summary", className), asChild, {
    "data-slot": "slot-picker-summary",
    "aria-live": "polite",
    ...rest,
    children:
      children ??
      `${formatLong(c.date)}, ${formatTime(c.time, g.hour12)} – ${formatTime(fromMinutes((toMinutes(c.time) ?? 0) + g.duration), g.hour12)} (${g.zone}, ${g.offset})`,
  });
}

/** The button that confirms the choice, from the picker's `confirmLabel` and `onConfirm`. */
export function SlotPickerConfirm({
  children,
  ...rest
}: Omit<ComponentProps<typeof Button>, "variant" | "onClick" | "disabled"> & {
  children?: ReactNode;
}) {
  const g = useSlotPicker("SlotPickerConfirm");
  const label = children ?? g.confirmLabel;
  if (!label || !g.confirm) return null;
  return (
    <Button
      data-slot="slot-picker-confirm"
      {...(rest as object)}
      variant="primary"
      disabled={!g.chosen}
      onClick={() => g.chosen && g.confirm?.(g.chosen)}
    >
      {label}
    </Button>
  );
}
