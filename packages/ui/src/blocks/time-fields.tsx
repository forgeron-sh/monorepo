// Two fields of the time blocks: a time zone found by typing (with its offset and the time there)
// and a duration in hours and minutes with the usual lengths one click away.

import { useMemo, useState } from "react";
import { Combobox, type ComboboxOption } from "../combobox";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { NumberInput } from "../numbers";
import { formatTime } from "../time";
import {
  clockIn,
  formatMinutes,
  formatOffset,
  isTimezone,
  listTimezones,
  timezoneOffset,
  zoneName,
} from "./time-model";

/* ---------------------------------------------------------------- TimezonePicker */

export interface TimezonePickerProps {
  /** Names the field, e.g. "Time zone". */
  label: string;
  /** An IANA zone such as `Europe/Paris`, or null for none. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** The zones offered; every zone the runtime knows by default. */
  timezones?: ReadonlyArray<string>;
  /** The moment the offsets and clocks are read at, in UTC milliseconds. Default: when it appeared. */
  now?: number;
  /** Clocks in 12 hours. */
  hour12?: boolean;
  placeholder?: string;
  /** A button that removes the choice. Default `false`: a zone is usually needed. */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
}

/** The zone of the device, or null where the runtime cannot say. */
export function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * A time zone chosen by typing part of its name (`paris`, `new york`, `utc+5`). Each row says its
 * offset and the time it is there, so the choice can be checked at a glance.
 */
export function TimezonePicker({
  label,
  value,
  defaultValue = null,
  onChange,
  timezones,
  now: nowProp,
  hour12 = false,
  placeholder = "Search a time zone",
  clearable = false,
  disabled,
  id,
  className,
  ...aria
}: TimezonePickerProps) {
  const [appeared] = useState(() => Date.now());
  const at = nowProp ?? appeared;
  const [zone, setZone] = useControllableState<string | null>({ value, defaultValue, onChange });
  const options = useMemo<ComboboxOption[]>(() => {
    const list = (timezones ?? listTimezones()).filter(isTimezone);
    if (zone && !list.includes(zone) && isTimezone(zone)) list.push(zone);
    return list.map((tz) => {
      const offset = formatOffset(timezoneOffset(tz, at));
      const clock = formatTime(clockIn(tz, at), hour12);
      // The offset is part of the label so that typing `utc+5` finds it.
      return { value: tz, label: `${zoneName(tz)} ${offset}`, hint: `${offset} · ${clock}` };
    });
  }, [timezones, at, zone, hour12]);

  return (
    <Combobox
      label={label}
      options={options}
      value={zone}
      onChange={(next) => setZone(next)}
      placeholder={placeholder}
      clearable={clearable}
      emptyText="No time zone matches"
      {...(disabled !== undefined ? { disabled } : {})}
      {...(id !== undefined ? { id } : {})}
      {...(className !== undefined
        ? { className: cx("fg-tz", className) }
        : { className: "fg-tz" })}
      {...aria}
    />
  );
}

/* ---------------------------------------------------------------- DurationInput */

export interface DurationInputProps {
  /** Names the field, e.g. "Duration". */
  label: string;
  /** Minutes, or null for none. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (minutes: number | null) => void;
  /** The usual lengths, as buttons; 15, 30, 45 min, 1, 1.5 and 2 h by default, `[]` for none. */
  presets?: ReadonlyArray<number>;
  /** The shortest length, in minutes. Default 0. */
  min?: number;
  /** The longest, in minutes. Default 24 hours. */
  max?: number;
  /** What the arrows add to the minutes. Default 5. */
  step?: number;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
}

export const DURATION_PRESETS: ReadonlyArray<number> = [15, 30, 45, 60, 90, 120];

/**
 * A length of time as hours and minutes. Typing 75 in the minutes makes 1 h 15; the presets are
 * toggles that set the value in one click.
 */
export function DurationInput({
  label,
  value,
  defaultValue = null,
  onChange,
  presets = DURATION_PRESETS,
  min = 0,
  max = 24 * 60,
  step = 5,
  disabled,
  className,
  ...aria
}: DurationInputProps) {
  const [total, setTotal] = useControllableState<number | null>({ value, defaultValue, onChange });
  const hours = total === null ? null : Math.floor(total / 60);
  const minutes = total === null ? null : total % 60;
  const fit = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
  const put = (n: number) => setTotal(fit(n));

  return (
    <div className={cx("fg-dur", className)} role="group" aria-label={label} {...aria}>
      <div className="fg-dur-row">
        <NumberInput
          className="fg-dur-num"
          label={`${label}, hours`}
          value={hours}
          min={0}
          max={Math.floor(max / 60)}
          buttons={false}
          suffix="h"
          placeholder="0"
          disabled={disabled}
          onChange={(h) =>
            h === null
              ? setTotal(minutes === null ? null : fit(minutes))
              : put(h * 60 + (minutes ?? 0))
          }
        />
        <NumberInput
          className="fg-dur-num"
          label={`${label}, minutes`}
          value={minutes}
          min={0}
          max={Math.max(59, max)}
          step={step}
          buttons={false}
          suffix="min"
          placeholder="0"
          disabled={disabled}
          onChange={(m) =>
            m === null
              ? setTotal(hours === null ? null : fit(hours * 60))
              : put((hours ?? 0) * 60 + m)
          }
        />
      </div>
      {presets.length > 0 ? (
        <div className="fg-dur-presets" role="group" aria-label={`${label}, usual lengths`}>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className="fg-dur-preset"
              aria-pressed={total === p}
              disabled={disabled}
              onClick={() => put(p)}
            >
              {formatMinutes(p)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
