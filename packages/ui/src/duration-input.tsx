// A length of time as hours and minutes, with the usual lengths one click away. The composed form
// is `DurationInput` with its parts (`DurationInputRow`, `DurationInputHours`, `DurationInputMinutes`,
// `DurationInputPresets`, `DurationInputPreset`); with `label`, the props-driven one built from them (D-157).

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { formatMinutes } from "./dates";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { NumberInput } from "./numbers";

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

interface DurationState {
  total: number | null;
  hours: number | null;
  minutes: number | null;
  min: number;
  max: number;
  step: number;
  disabled: boolean | undefined;
  /** Sets a length in minutes, kept between `min` and `max`. */
  put: (minutes: number) => void;
  /** Sets the length, or clears it. */
  setTotal: (minutes: number | null) => void;
  fit: (minutes: number) => number;
}

const DurationContext = createContext<DurationState | null>(null);

function useDuration(): DurationState {
  const state = useContext(DurationContext);
  if (!state) throw new Error("DurationInput parts go inside <DurationInput>.");
  return state;
}

/**
 * A length of time as hours and minutes. With `label`: typing 75 in the minutes makes 1 h 15, the
 * presets are toggles that set the value in one click. Without: the root of the parts.
 */
export function DurationInput(props: DurationInputProps | DurationInputRootProps) {
  return props.label !== undefined ? (
    <DurationInputBox {...(props as DurationInputProps)} />
  ) : (
    <DurationInputRoot {...(props as DurationInputRootProps)} />
  );
}

function DurationInputBox({
  label,
  value,
  defaultValue,
  onChange,
  presets = DURATION_PRESETS,
  min,
  max,
  step,
  disabled,
  className,
  ...aria
}: DurationInputProps) {
  return (
    <DurationInputRoot
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onChange ? { onValueChange: onChange } : {})}
      {...(min !== undefined ? { min } : {})}
      {...(max !== undefined ? { max } : {})}
      {...(step !== undefined ? { step } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(className !== undefined ? { className } : {})}
      aria-label={label}
      {...aria}
    >
      <DurationInputRow>
        <DurationInputHours label={`${label}, hours`} />
        <DurationInputMinutes label={`${label}, minutes`} />
      </DurationInputRow>
      {presets.length > 0 ? (
        <DurationInputPresets aria-label={`${label}, usual lengths`}>
          {presets.map((p) => (
            <DurationInputPreset key={p} minutes={p} />
          ))}
        </DurationInputPresets>
      ) : null}
    </DurationInputRoot>
  );
}

/** `label` stays undefined: with a label, `DurationInput` is the props-driven one. */
export type DurationInputRootProps = Omit<
  ComponentProps<"div">,
  "className" | "defaultValue" | "onChange"
> & {
  label?: undefined;
  /** Minutes, or null for none. */
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (minutes: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
};

function DurationInputRoot({
  label: _label,
  value,
  defaultValue = null,
  onValueChange,
  min = 0,
  max = 24 * 60,
  step = 5,
  disabled,
  className,
  children,
  ...rest
}: DurationInputRootProps) {
  const [total, setTotal] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const fit = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
  const state: DurationState = {
    total,
    hours: total === null ? null : Math.floor(total / 60),
    minutes: total === null ? null : total % 60,
    min,
    max,
    step,
    disabled,
    put: (n) => setTotal(fit(n)),
    setTotal,
    fit,
  };
  return (
    <DurationContext.Provider value={state}>
      <div role="group" {...rest} className={cx("fg-dur", className)}>
        {children}
      </div>
    </DurationContext.Provider>
  );
}

export type DurationInputRowProps = ComponentProps<"div">;

/** The line of the two number fields. */
export function DurationInputRow({ className, ...rest }: DurationInputRowProps) {
  return <div {...rest} className={cx("fg-dur-row", className)} />;
}

export interface DurationInputPartProps {
  /** Names the field for assistive technology. */
  label?: string;
  placeholder?: string;
  className?: string;
}

/** The hours. */
export function DurationInputHours({
  label = "Hours",
  placeholder = "0",
  className,
}: DurationInputPartProps) {
  const d = useDuration();
  return (
    <NumberInput
      className={cx("fg-dur-num", className)}
      label={label}
      value={d.hours}
      min={0}
      max={Math.floor(d.max / 60)}
      buttons={false}
      suffix="h"
      placeholder={placeholder}
      disabled={d.disabled}
      onChange={(h) =>
        h === null
          ? d.setTotal(d.minutes === null ? null : d.fit(d.minutes))
          : d.put(h * 60 + (d.minutes ?? 0))
      }
    />
  );
}

/** The minutes; typing more than 59 carries into the hours. */
export function DurationInputMinutes({
  label = "Minutes",
  placeholder = "0",
  className,
}: DurationInputPartProps) {
  const d = useDuration();
  return (
    <NumberInput
      className={cx("fg-dur-num", className)}
      label={label}
      value={d.minutes}
      min={0}
      max={Math.max(59, d.max)}
      step={d.step}
      buttons={false}
      suffix="min"
      placeholder={placeholder}
      disabled={d.disabled}
      onChange={(m) =>
        m === null
          ? d.setTotal(d.hours === null ? null : d.fit(d.hours * 60))
          : d.put((d.hours ?? 0) * 60 + m)
      }
    />
  );
}

export type DurationInputPresetsProps = ComponentProps<"div">;

/** The group of the usual lengths. */
export function DurationInputPresets({ className, ...rest }: DurationInputPresetsProps) {
  return <div role="group" {...rest} className={cx("fg-dur-presets", className)} />;
}

export type DurationInputPresetProps = Omit<ComponentProps<"button">, "onClick" | "children"> & {
  /** The length it sets, in minutes. */
  minutes: number;
  children?: ReactNode;
};

/** A length that sets the value in one click; pressed while it is the value. */
export function DurationInputPreset({
  minutes,
  className,
  children,
  ...rest
}: DurationInputPresetProps) {
  const d = useDuration();
  return (
    <button
      type="button"
      disabled={d.disabled}
      {...rest}
      className={cx("fg-dur-preset", className)}
      aria-pressed={d.total === minutes}
      onClick={() => d.put(minutes)}
    >
      {children ?? formatMinutes(minutes)}
    </button>
  );
}
