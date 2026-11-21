// When someone can be booked, after the hours of the Agenda and Time off prototypes: for each
// weekday a switch and as many ranges as needed, a button that copies a day to others, dates that
// differ (a day off, other hours) and the time zone the hours are read in.
//
// Two ways to use it. With props it is the whole editor. With children it is the root of the parts:
//
//   <AvailabilityEditor defaultValue={hours}>
//     <AvailabilityEditorZone />
//     <AvailabilityEditorWeek />
//     <AvailabilityEditorExceptions />
//   </AvailabilityEditor>
//
// `AvailabilityEditorWeek` is seven `AvailabilityEditorDay` (each a `AvailabilityEditorDayHead`,
// `AvailabilityEditorDayBody` and `AvailabilityEditorCopy`); `AvailabilityEditorExceptions` is the
// list of `AvailabilityEditorException` and the `AvailabilityEditorExceptionAdd` form. The ranges of
// a day are `AvailabilityEditorRanges`.

import { Copy01Icon, Delete02Icon, PlusSignIcon } from "@forgeron/icons";
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "../button";
import { Segmented, Switch } from "../controls";
import { cx } from "../cx";
import { formatShort, WEEKDAYS } from "../dates";
import { Checkbox } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { DatePicker } from "../overlays";
import { Popover } from "../popover";
import { renderPart, type Part } from "../part";
import { TimePicker } from "../time";
import { TimezonePicker } from "../timezone-picker";
import {
  defaultWeekly,
  formatMinutes,
  nextSpan,
  spanErrors,
  totalMinutes,
  type Availability,
  type AvailabilityException,
  type TimeSpan,
} from "./time-model";

interface AvailabilityEditorBase {
  value?: Availability;
  defaultValue?: Availability;
  onChange?: (value: Availability) => void;
  /** The zones offered; every zone the runtime knows by default. */
  timezones?: ReadonlyArray<string>;
  /** Shows the time zone field. Default `true`. */
  showTimezone?: boolean;
  /** Shows the dates that differ. Default `true`. */
  showExceptions?: boolean;
  /** Minutes between the times of a list. Default 15. */
  step?: number;
  hour12?: boolean;
  /** `YYYY-MM-DD`: the earliest exception that can be added. Defaults to the device's date. */
  today?: string;
  disabled?: boolean;
}

type RootAttrs = Omit<Part<ComponentProps<"div">>, "children" | "onChange" | "defaultValue"> & {
  asChild?: boolean;
};

export interface AvailabilityEditorProps extends AvailabilityEditorBase, RootAttrs {
  /** Given, `AvailabilityEditor` is the root of the parts. */
  children?: undefined;
}

export interface AvailabilityEditorRootProps extends AvailabilityEditorBase, RootAttrs {
  children: ReactNode;
}

const EMPTY: Availability = { timezone: "UTC", weekly: defaultWeekly(), exceptions: [] };

interface AvailabilityState {
  value: Availability;
  /** Replaces the whole value. */
  set: (value: Availability) => void;
  /** Sets the ranges of a weekday, from 0 (Monday). */
  setDay: (day: number, spans: TimeSpan[]) => void;
  /** Changes the exception of a date. */
  setException: (date: string, patch: Partial<AvailabilityException>) => void;
  timezones: ReadonlyArray<string> | undefined;
  step: number;
  hour12: boolean;
  today: string | undefined;
  disabled: boolean | undefined;
  showTimezone: boolean;
  showExceptions: boolean;
}

const AvailabilityContext = createContext<AvailabilityState | null>(null);

/** The state of the `AvailabilityEditor` a part sits in: the value and the ways to change it. */
export function useAvailabilityEditor(part = "useAvailabilityEditor"): AvailabilityState {
  const state = useContext(AvailabilityContext);
  if (!state) throw new Error(`${part} goes inside an AvailabilityEditor.`);
  return state;
}

/**
 * Weekly hours with several ranges a day, copy to other days, dates with their own hours or off,
 * and the time zone. Ranges are validated as they are typed (empty, inverted, overlapping).
 */
export function AvailabilityEditor(props: AvailabilityEditorProps | AvailabilityEditorRootProps) {
  const {
    value,
    defaultValue = EMPTY,
    onChange,
    timezones,
    showTimezone = true,
    showExceptions = true,
    step = 15,
    hour12 = false,
    today,
    disabled,
    className,
    asChild,
    children,
    ...rest
  } = props;
  const [a, setA] = useControllableState<Availability>({ value, defaultValue, onChange });
  const state: AvailabilityState = {
    value: a,
    set: setA,
    setDay: (day, spans) => setA({ ...a, weekly: a.weekly.map((d, i) => (i === day ? spans : d)) }),
    setException: (date, patch) =>
      setA({
        ...a,
        exceptions: a.exceptions.map((e) => (e.date === date ? { ...e, ...patch } : e)),
      }),
    timezones,
    step,
    hour12,
    today,
    disabled,
    showTimezone,
    showExceptions,
  };
  return (
    <AvailabilityContext.Provider value={state}>
      {renderPart("div", cx("fg-av", className), asChild, {
        "data-slot": "availability-editor",
        ...rest,
        children: children ?? (
          <>
            {showTimezone ? <AvailabilityEditorZone /> : null}
            <AvailabilityEditorWeek />
            {showExceptions ? <AvailabilityEditorExceptions /> : null}
          </>
        ),
      })}
    </AvailabilityContext.Provider>
  );
}

type Parted<T> = Part<T> & { asChild?: boolean };

/** The time zone the hours are read in. */
export function AvailabilityEditorZone({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useAvailabilityEditor("AvailabilityEditorZone");
  return renderPart("div", cx("fg-av-zone", className), asChild, {
    "data-slot": "availability-editor-zone",
    ...rest,
    children: children ?? (
      <>
        <span className="fg-av-caption">Time zone</span>
        <TimezonePicker
          label="Time zone"
          value={g.value.timezone}
          disabled={g.disabled}
          {...(g.timezones ? { timezones: g.timezones } : {})}
          hour12={g.hour12}
          onChange={(tz) => tz && g.set({ ...g.value, timezone: tz })}
        />
      </>
    ),
  });
}

/** The week: one `AvailabilityEditorDay` per weekday, Monday first. */
export function AvailabilityEditorWeek({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"ul">>) {
  return renderPart("ul", cx("fg-av-week", className), asChild, {
    "data-slot": "availability-editor-week",
    "aria-label": "Weekly hours",
    ...rest,
    children:
      children ?? WEEKDAYS.map((name, day) => <AvailabilityEditorDay key={name} day={day} />),
  });
}

interface DayContext {
  day: number;
  name: string;
}
const DayCtx = createContext<DayContext | null>(null);

function useDay(part: string): DayContext {
  const ctx = useContext(DayCtx);
  if (!ctx) throw new Error(`${part} goes inside an AvailabilityEditorDay.`);
  return ctx;
}

export interface AvailabilityEditorDayProps extends Parted<ComponentProps<"li">> {
  /** The weekday, from 0 (Monday) to 6. */
  day: number;
}

/** One weekday: its switch, its ranges and the button that copies them to other days. */
export function AvailabilityEditorDay({
  day,
  className,
  asChild,
  children,
  ...rest
}: AvailabilityEditorDayProps) {
  const name = WEEKDAYS[day] ?? String(day);
  return (
    <DayCtx.Provider value={{ day, name }}>
      {renderPart("li", cx("fg-av-day", className), asChild, {
        "data-slot": "availability-editor-day",
        ...rest,
        children: children ?? (
          <>
            <AvailabilityEditorDayHead />
            <AvailabilityEditorDayBody />
            <AvailabilityEditorCopy />
          </>
        ),
      })}
    </DayCtx.Provider>
  );
}

/** The switch of the weekday, and how long it is open. */
export function AvailabilityEditorDayHead({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useAvailabilityEditor("AvailabilityEditorDayHead");
  const { day, name } = useDay("AvailabilityEditorDayHead");
  const spans = g.value.weekly[day] ?? [];
  const open = spans.length > 0;
  return renderPart("div", cx("fg-av-dayhead", className), asChild, {
    "data-slot": "availability-editor-day-head",
    ...rest,
    children: children ?? (
      <>
        <Switch
          label={name}
          checked={open}
          disabled={g.disabled}
          onChange={(e) =>
            g.setDay(day, e.target.checked ? [{ start: "09:00", end: "17:00" }] : [])
          }
        />
        {open ? <span className="fg-av-total">{formatMinutes(totalMinutes(spans))}</span> : null}
      </>
    ),
  });
}

/** The ranges of the weekday, or "Unavailable". */
export function AvailabilityEditorDayBody({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useAvailabilityEditor("AvailabilityEditorDayBody");
  const { day, name } = useDay("AvailabilityEditorDayBody");
  const spans = g.value.weekly[day] ?? [];
  return renderPart("div", cx("fg-av-daybody", className), asChild, {
    "data-slot": "availability-editor-day-body",
    ...rest,
    children:
      children ??
      (spans.length > 0 ? (
        <AvailabilityEditorRanges
          label={name}
          spans={spans}
          onChange={(next) => g.setDay(day, next)}
        />
      ) : (
        <span className="fg-av-closed">Unavailable</span>
      )),
  });
}

/** The button that copies the weekday's ranges to the days ticked in its popover. */
export function AvailabilityEditorCopy({ className }: { className?: string }) {
  const g = useAvailabilityEditor("AvailabilityEditorCopy");
  const { day, name } = useDay("AvailabilityEditorCopy");
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<number[]>([]);
  const spans = g.value.weekly[day] ?? [];
  return (
    <Popover
      label={`Copy ${name} to other days`}
      title="Copy to"
      width={220}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setTargets([]);
      }}
      trigger={
        <IconButton
          icon={Copy01Icon}
          size="sm"
          label={`Copy ${name} to other days`}
          disabled={g.disabled || spans.length === 0}
          {...(className ? { className } : {})}
        />
      }
    >
      <div className="fg-av-copy">
        {WEEKDAYS.map((other, j) =>
          j === day ? null : (
            <Checkbox
              key={other}
              label={other}
              checked={targets.includes(j)}
              onChange={(e) =>
                setTargets(e.target.checked ? [...targets, j] : targets.filter((t) => t !== j))
              }
            />
          ),
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={targets.length === 0}
          onClick={() => {
            g.set({
              ...g.value,
              weekly: g.value.weekly.map((d, i) =>
                targets.includes(i) ? spans.map((s) => ({ ...s })) : d,
              ),
            });
            setOpen(false);
            setTargets([]);
          }}
        >
          Apply
        </Button>
      </div>
    </Popover>
  );
}

export interface AvailabilityEditorRangesProps extends Omit<
  Parted<ComponentProps<"div">>,
  "onChange"
> {
  /** Names the day or the date the ranges belong to: "Monday". */
  label: string;
  spans: TimeSpan[];
  onChange: (spans: TimeSpan[]) => void;
}

/** The ranges of one day: a start, an end, a remove button each, and a button that adds one. */
export function AvailabilityEditorRanges({
  label,
  spans,
  onChange,
  className,
  asChild,
  ...rest
}: AvailabilityEditorRangesProps) {
  const g = useAvailabilityEditor("AvailabilityEditorRanges");
  const errors = spanErrors(spans);
  const set = (i: number, patch: Partial<TimeSpan>) =>
    onChange(spans.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return renderPart("div", cx("fg-av-spans", className), asChild, {
    "data-slot": "availability-editor-ranges",
    ...rest,
    children: (
      <>
        {spans.map((s, i) => (
          <div key={i} className="fg-av-span">
            <TimePicker
              label={`${label}, range ${i + 1}, from`}
              value={s.start}
              hour12={g.hour12}
              step={g.step}
              disabled={g.disabled}
              aria-invalid={errors[i] ? true : undefined}
              onChange={(v) => v && set(i, { start: v })}
            />
            <span className="fg-av-to" aria-hidden="true">
              –
            </span>
            <TimePicker
              label={`${label}, range ${i + 1}, to`}
              value={s.end === "24:00" ? "23:59" : s.end}
              hour12={g.hour12}
              step={g.step}
              disabled={g.disabled}
              aria-invalid={errors[i] ? true : undefined}
              onChange={(v) => v && set(i, { end: v })}
            />
            <IconButton
              icon={Delete02Icon}
              size="sm"
              label={`Remove range ${i + 1} of ${label}`}
              disabled={g.disabled}
              onClick={() => onChange(spans.filter((_, j) => j !== i))}
            />
            {errors[i] ? (
              <span className="fg-av-error" role="alert">
                {errors[i]}
              </span>
            ) : null}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={g.disabled}
          aria-label={`Add a range to ${label}`}
          onClick={() => onChange([...spans, nextSpan(spans)])}
        >
          <Icon icon={PlusSignIcon} size={12} variant="mono" /> Add range
        </Button>
      </>
    ),
  });
}

/** The dates that differ: the list of exceptions and the form that adds one. */
export function AvailabilityEditorExceptions({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"section">>) {
  return renderPart("section", cx("fg-av-exceptions", className), asChild, {
    "data-slot": "availability-editor-exceptions",
    "aria-label": "Date exceptions",
    ...rest,
    children: children ?? (
      <>
        <h3 className="fg-av-caption">Exceptions</h3>
        <AvailabilityEditorExceptionList />
        <AvailabilityEditorExceptionAdd />
      </>
    ),
  });
}

/** The exceptions, by date; "No exception" when there are none. */
export function AvailabilityEditorExceptionList({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"ul">>) {
  const g = useAvailabilityEditor("AvailabilityEditorExceptionList");
  const exceptions = [...g.value.exceptions].sort((x, y) => (x.date < y.date ? -1 : 1));
  if (exceptions.length === 0) {
    return <p className="fg-av-closed">No exception: the weekly hours always apply.</p>;
  }
  return renderPart("ul", cx("fg-av-list", className), asChild, {
    "data-slot": "availability-editor-exception-list",
    ...rest,
    children:
      children ?? exceptions.map((e) => <AvailabilityEditorException key={e.date} exception={e} />),
  });
}

export interface AvailabilityEditorExceptionProps extends Parted<ComponentProps<"li">> {
  exception: AvailabilityException;
}

/** One date that differs: a day off, or other hours. */
export function AvailabilityEditorException({
  exception: e,
  className,
  asChild,
  children,
  ...rest
}: AvailabilityEditorExceptionProps) {
  const g = useAvailabilityEditor("AvailabilityEditorException");
  return renderPart("li", cx("fg-av-exception", className), asChild, {
    "data-slot": "availability-editor-exception",
    ...rest,
    children: children ?? (
      <>
        <span className="fg-av-date">{formatShort(e.date)}</span>
        <span className="fg-av-kind">{e.kind === "off" ? "Day off" : "Custom hours"}</span>
        <div className="fg-av-daybody">
          {e.kind === "hours" ? (
            <AvailabilityEditorRanges
              label={formatShort(e.date)}
              spans={e.spans}
              onChange={(spans) => g.setException(e.date, { spans })}
            />
          ) : null}
        </div>
        <IconButton
          icon={Delete02Icon}
          size="sm"
          label={`Remove the exception of ${formatShort(e.date)}`}
          disabled={g.disabled}
          onClick={() =>
            g.set({ ...g.value, exceptions: g.value.exceptions.filter((x) => x.date !== e.date) })
          }
        />
      </>
    ),
  });
}

/** The form that adds an exception: a date, a kind, a button. */
export function AvailabilityEditorExceptionAdd({
  className,
  asChild,
  children,
  ...rest
}: Parted<ComponentProps<"div">>) {
  const g = useAvailabilityEditor("AvailabilityEditorExceptionAdd");
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<"off" | "hours">("off");
  const taken = newDate !== null && g.value.exceptions.some((e) => e.date === newDate);
  const add = () => {
    if (!newDate || taken) return;
    const e: AvailabilityException =
      newKind === "off"
        ? { date: newDate, kind: "off", spans: [] }
        : { date: newDate, kind: "hours", spans: [{ start: "09:00", end: "13:00" }] };
    g.set({ ...g.value, exceptions: [...g.value.exceptions, e] });
    setNewDate(null);
  };
  return renderPart("div", cx("fg-av-add", className), asChild, {
    "data-slot": "availability-editor-exception-add",
    ...rest,
    children: children ?? (
      <>
        <DatePicker
          label="Exception date"
          variant="field"
          placeholder="Choose a date"
          presets={[]}
          clearable={false}
          {...(g.today ? { today: g.today } : {})}
          value={newDate}
          onChange={setNewDate}
        />
        <Segmented
          label="Exception kind"
          options={[
            { value: "off", label: "Day off" },
            { value: "hours", label: "Custom hours" },
          ]}
          value={newKind}
          onChange={(k) => setNewKind(k as "off" | "hours")}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={g.disabled || !newDate || taken}
          onClick={add}
        >
          Add exception
        </Button>
      </>
    ),
  });
}
