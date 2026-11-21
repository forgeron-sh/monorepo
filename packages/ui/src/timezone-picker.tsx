// A time zone found by typing (`paris`, `new york`, `utc+5`), with its offset and the time there on
// each row. With `label`, a props-driven field on the Combobox; without, the root of its parts
// (`TimezonePickerInput`, `TimezonePickerContent`, `TimezonePickerItem`), built on the Combobox parts.

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import {
  clockIn,
  formatOffset,
  isTimezone,
  listTimezones,
  timezoneOffset,
  zoneName,
} from "./time-zones";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  type ComboboxContentProps,
  type ComboboxInputProps,
  type ComboboxItemProps,
  type ComboboxOption,
} from "./combobox";
import { Combobox as ComboboxBase } from "@base-ui/react/combobox";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { formatTime } from "./time";

export interface TimezonePickerProps extends Omit<
  ComponentProps<"div">,
  | "onChange"
  | "defaultValue"
  | "children"
  | "className"
  | "id"
  | "placeholder"
  | "aria-describedby"
  | "aria-invalid"
> {
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
export function TimezonePicker(props: TimezonePickerProps | TimezonePickerRootProps) {
  return props.label !== undefined ? (
    <TimezoneField {...(props as TimezonePickerProps)} />
  ) : (
    <TimezonePickerRoot {...(props as TimezonePickerRootProps)} />
  );
}

/** The options of the picker: a zone, its offset and its clock, searchable by name and offset. */
function useZoneOptions(
  timezones: ReadonlyArray<string> | undefined,
  nowProp: number | undefined,
  hour12: boolean,
  zone: string | null,
): ComboboxOption[] {
  const [appeared] = useState(() => Date.now());
  const at = nowProp ?? appeared;
  return useMemo<ComboboxOption[]>(() => {
    const list = (timezones ?? listTimezones()).filter(isTimezone);
    if (zone && !list.includes(zone) && isTimezone(zone)) list.push(zone);
    return list.map((tz) => {
      const offset = formatOffset(timezoneOffset(tz, at));
      const clock = formatTime(clockIn(tz, at), hour12);
      // The offset is part of the label so that typing `utc+5` finds it.
      return { value: tz, label: `${zoneName(tz)} ${offset}`, hint: `${offset} · ${clock}` };
    });
  }, [timezones, at, zone, hour12]);
}

/** `label` stays undefined: with a label, `TimezonePicker` is the props-driven one. */
export interface TimezonePickerRootProps {
  label?: undefined;
  /** An IANA zone such as `Europe/Paris`, or null for none. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  timezones?: ReadonlyArray<string>;
  now?: number;
  hour12?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

const TZ_PROPS = {
  isItemEqualToValue: (a: ComboboxOption, b: ComboboxOption) => a.value === b.value,
  itemToStringLabel: (item: ComboboxOption | null | undefined) => item?.label ?? "",
  filter: (item: ComboboxOption, query: string) =>
    item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
};

function TimezonePickerRoot({
  value,
  defaultValue = null,
  onChange,
  timezones,
  now,
  hour12 = false,
  disabled,
  children,
}: TimezonePickerRootProps) {
  const [zone, setZone] = useControllableState<string | null>({ value, defaultValue, onChange });
  const options = useZoneOptions(timezones, now, hour12, zone);
  const chosen = options.find((o) => o.value === zone) ?? null;
  const props = {
    items: options,
    value: chosen,
    onValueChange: (next: ComboboxOption | null) => setZone(next?.value ?? null),
    disabled,
    ...TZ_PROPS,
  } as unknown as ComponentProps<typeof ComboboxBase.Root>;
  return <ComboboxBase.Root {...props}>{children}</ComboboxBase.Root>;
}

/** The field: the zone searched by name or offset (`paris`, `utc+5`). */
export function TimezonePickerInput({ className, ...rest }: ComboboxInputProps) {
  return (
    <ComboboxInput
      data-slot="timezone-picker-input"
      placeholder="Search a time zone"
      {...rest}
      groupClassName={cx("fg-tz", rest.groupClassName)}
      className={className}
    />
  );
}

/** One zone: its name, its offset and the time there. `zone` is an item of the root's list. */
export function TimezonePickerItem({
  zone,
  children,
  ...rest
}: Omit<ComboboxItemProps, "value"> & { zone: ComboboxOption }) {
  return (
    <ComboboxItem data-slot="timezone-picker-item" value={zone} hint={zone.hint} {...rest}>
      {children ?? zone.label}
    </ComboboxItem>
  );
}

export type TimezonePickerContentProps = Omit<ComboboxContentProps, "children"> & {
  /** Shown when no zone matches. */
  emptyText?: string;
  /** Renders a row; default: a `TimezonePickerItem`. */
  children?: (zone: ComboboxOption) => ReactNode;
};

/** The list under the field: every zone that matches, or `emptyText`. */
export function TimezonePickerContent({
  emptyText = "No time zone matches",
  children,
  ...rest
}: TimezonePickerContentProps) {
  return (
    <ComboboxContent data-slot="timezone-picker-content" {...rest}>
      <ComboboxEmpty>{emptyText}</ComboboxEmpty>
      <ComboboxList>
        {(zone: ComboboxOption) =>
          children ? children(zone) : <TimezonePickerItem key={zone.value} zone={zone} />
        }
      </ComboboxList>
    </ComboboxContent>
  );
}

function TimezoneField({
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
  const [zone, setZone] = useControllableState<string | null>({ value, defaultValue, onChange });
  const options = useZoneOptions(timezones, nowProp, hour12, zone);

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
      data-slot="timezone-picker"
      {...aria}
    />
  );
}
