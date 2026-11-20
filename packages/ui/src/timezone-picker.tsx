// A time zone found by typing (`paris`, `new york`, `utc+5`), with its offset and the time there on
// each row. A thin props-driven field on the Combobox: it has no parts of its own (D-157).

import { useMemo, useState } from "react";
import {
  clockIn,
  formatOffset,
  isTimezone,
  listTimezones,
  timezoneOffset,
  zoneName,
} from "./time-zones";
import { Combobox, type ComboboxOption } from "./combobox";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { formatTime } from "./time";

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
