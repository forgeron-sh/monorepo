// When someone can be booked, after the hours of the Agenda and Time off prototypes: for each
// weekday a switch and as many ranges as needed, a button that copies a day to others, dates that
// differ (a day off, other hours) and the time zone the hours are read in.

import { Copy01Icon, Delete02Icon, PlusSignIcon } from "@forgeron/icons";
import { useState } from "react";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { formatShort, WEEKDAYS } from "../dates";
import { Checkbox } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { DatePicker } from "../overlays";
import { Popover } from "../popover";
import { Switch } from "../controls";
import { TimePicker } from "../time";
import { TimezonePicker } from "./time-fields";
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

export interface AvailabilityEditorProps {
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
  className?: string;
}

const EMPTY: Availability = { timezone: "UTC", weekly: defaultWeekly(), exceptions: [] };

interface SpanListProps {
  label: string;
  spans: TimeSpan[];
  onChange: (spans: TimeSpan[]) => void;
  step: number;
  hour12: boolean;
  disabled: boolean | undefined;
}

/** The ranges of one day: a start, an end, a remove button each, and a button that adds one. */
function SpanList({ label, spans, onChange, step, hour12, disabled }: SpanListProps) {
  const errors = spanErrors(spans);
  const set = (i: number, patch: Partial<TimeSpan>) =>
    onChange(spans.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="fg-av-spans">
      {spans.map((s, i) => (
        <div key={i} className="fg-av-span">
          <TimePicker
            label={`${label}, range ${i + 1}, from`}
            value={s.start}
            hour12={hour12}
            step={step}
            disabled={disabled}
            aria-invalid={errors[i] ? true : undefined}
            onChange={(v) => v && set(i, { start: v })}
          />
          <span className="fg-av-to" aria-hidden="true">
            –
          </span>
          <TimePicker
            label={`${label}, range ${i + 1}, to`}
            value={s.end === "24:00" ? "23:59" : s.end}
            hour12={hour12}
            step={step}
            disabled={disabled}
            aria-invalid={errors[i] ? true : undefined}
            onChange={(v) => v && set(i, { end: v })}
          />
          <IconButton
            icon={Delete02Icon}
            size="sm"
            label={`Remove range ${i + 1} of ${label}`}
            disabled={disabled}
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
        disabled={disabled}
        aria-label={`Add a range to ${label}`}
        onClick={() => onChange([...spans, nextSpan(spans)])}
      >
        <Icon icon={PlusSignIcon} size={12} variant="mono" /> Add range
      </Button>
    </div>
  );
}

/**
 * Weekly hours with several ranges a day, copy to other days, dates with their own hours or off,
 * and the time zone. Ranges are validated as they are typed (empty, inverted, overlapping).
 */
export function AvailabilityEditor({
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
}: AvailabilityEditorProps) {
  const [a, setA] = useControllableState<Availability>({ value, defaultValue, onChange });
  const [copyFrom, setCopyFrom] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<"off" | "hours">("off");

  const setDay = (day: number, spans: TimeSpan[]) =>
    setA({ ...a, weekly: a.weekly.map((d, i) => (i === day ? spans : d)) });
  const exceptions = [...a.exceptions].sort((x, y) => (x.date < y.date ? -1 : 1));
  const setException = (date: string, patch: Partial<AvailabilityException>) =>
    setA({
      ...a,
      exceptions: a.exceptions.map((e) => (e.date === date ? { ...e, ...patch } : e)),
    });

  const addException = () => {
    if (!newDate || a.exceptions.some((e) => e.date === newDate)) return;
    const e: AvailabilityException =
      newKind === "off"
        ? { date: newDate, kind: "off", spans: [] }
        : { date: newDate, kind: "hours", spans: [{ start: "09:00", end: "13:00" }] };
    setA({ ...a, exceptions: [...a.exceptions, e] });
    setNewDate(null);
  };

  return (
    <div className={cx("fg-av", className)}>
      {showTimezone ? (
        <div className="fg-av-zone">
          <span className="fg-av-caption">Time zone</span>
          <TimezonePicker
            label="Time zone"
            value={a.timezone}
            disabled={disabled}
            {...(timezones ? { timezones } : {})}
            hour12={hour12}
            onChange={(tz) => tz && setA({ ...a, timezone: tz })}
          />
        </div>
      ) : null}
      <ul className="fg-av-week" aria-label="Weekly hours">
        {WEEKDAYS.map((name, day) => {
          const spans = a.weekly[day] ?? [];
          const open = spans.length > 0;
          return (
            <li key={name} className="fg-av-day">
              <div className="fg-av-dayhead">
                <Switch
                  label={name}
                  checked={open}
                  disabled={disabled}
                  onChange={(e) =>
                    setDay(day, e.target.checked ? [{ start: "09:00", end: "17:00" }] : [])
                  }
                />
                {open ? (
                  <span className="fg-av-total">{formatMinutes(totalMinutes(spans))}</span>
                ) : null}
              </div>
              <div className="fg-av-daybody">
                {open ? (
                  <SpanList
                    label={name}
                    spans={spans}
                    onChange={(next) => setDay(day, next)}
                    step={step}
                    hour12={hour12}
                    disabled={disabled}
                  />
                ) : (
                  <span className="fg-av-closed">Unavailable</span>
                )}
              </div>
              <Popover
                label={`Copy ${name} to other days`}
                title="Copy to"
                width={220}
                open={copyFrom === day}
                onOpenChange={(o) => {
                  setCopyFrom(o ? day : null);
                  setTargets([]);
                }}
                trigger={
                  <IconButton
                    icon={Copy01Icon}
                    size="sm"
                    label={`Copy ${name} to other days`}
                    disabled={disabled || !open}
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
                          setTargets(
                            e.target.checked ? [...targets, j] : targets.filter((t) => t !== j),
                          )
                        }
                      />
                    ),
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={targets.length === 0}
                    onClick={() => {
                      setA({
                        ...a,
                        weekly: a.weekly.map((d, i) =>
                          targets.includes(i) ? spans.map((s) => ({ ...s })) : d,
                        ),
                      });
                      setCopyFrom(null);
                      setTargets([]);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </Popover>
            </li>
          );
        })}
      </ul>
      {showExceptions ? (
        <section className="fg-av-exceptions" aria-label="Date exceptions">
          <h3 className="fg-av-caption">Exceptions</h3>
          {exceptions.length === 0 ? (
            <p className="fg-av-closed">No exception: the weekly hours always apply.</p>
          ) : (
            <ul className="fg-av-list">
              {exceptions.map((e) => (
                <li key={e.date} className="fg-av-exception">
                  <span className="fg-av-date">{formatShort(e.date)}</span>
                  <span className="fg-av-kind">
                    {e.kind === "off" ? "Day off" : "Custom hours"}
                  </span>
                  <div className="fg-av-daybody">
                    {e.kind === "hours" ? (
                      <SpanList
                        label={formatShort(e.date)}
                        spans={e.spans}
                        onChange={(spans) => setException(e.date, { spans })}
                        step={step}
                        hour12={hour12}
                        disabled={disabled}
                      />
                    ) : null}
                  </div>
                  <IconButton
                    icon={Delete02Icon}
                    size="sm"
                    label={`Remove the exception of ${formatShort(e.date)}`}
                    disabled={disabled}
                    onClick={() =>
                      setA({ ...a, exceptions: a.exceptions.filter((x) => x.date !== e.date) })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="fg-av-add">
            <DatePicker
              label="Exception date"
              variant="field"
              placeholder="Choose a date"
              presets={[]}
              clearable={false}
              {...(today ? { today } : {})}
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
              disabled={disabled || !newDate || a.exceptions.some((e) => e.date === newDate)}
              onClick={addException}
            >
              Add exception
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
