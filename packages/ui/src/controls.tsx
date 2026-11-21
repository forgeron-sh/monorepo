import type { ComponentProps, InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupItemProps,
  type ToggleGroupProps,
} from "./toggle-group";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {
  label: ReactNode;
}

/**
 * An on/off setting that applies at once: a sharp track whose square knob lights in ember. With
 * `label`, the native one; without, shadcn's Switch (Base UI: `checked`, `onCheckedChange`), D-156.
 */
export function Switch(props: SwitchProps | SwitchRootProps) {
  return props.label !== undefined ? (
    <LabelledSwitch {...(props as SwitchProps)} />
  ) : (
    <SwitchRoot {...(props as SwitchRootProps)} />
  );
}

/** `label` stays undefined: with a label, `Switch` is the native one. */
export type SwitchRootProps = Omit<ComponentProps<typeof BaseSwitch.Root>, "className"> & {
  className?: string;
  /** shadcn's `sm` is a smaller track. */
  size?: "default" | "sm";
  label?: undefined;
};

function SwitchRoot({ className, size = "default", label: _label, ...rest }: SwitchRootProps) {
  return (
    <BaseSwitch.Root
      {...rest}
      data-size={size}
      className={cx("fg-sw", size === "sm" && "fg-sw-sm", className)}
    >
      <BaseSwitch.Thumb className="fg-sw-thumb" />
    </BaseSwitch.Root>
  );
}

function LabelledSwitch({ label, className, ...rest }: SwitchProps) {
  return (
    <label className={cx("fg-switch", className)}>
      <input {...rest} type="checkbox" role="switch" className="fg-switch-input" />
      <span>{label}</span>
    </label>
  );
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  /** One line under the label. */
  hint?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The question the choice answers, said once for the whole group. */
  label: ReactNode;
  /** The `name` of the inputs; one is made up when absent. */
  name?: string;
  options: ReadonlyArray<RadioOption>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** `row` puts the options side by side. */
  direction?: "column" | "row";
  disabled?: boolean;
  className?: string;
}

/**
 * One choice among a few, all visible: a fieldset of square radios, the chosen one filled with a
 * square. With `options`, the props-driven one; without, shadcn's `RadioGroup` + `RadioGroupItem`
 * (Base UI: `value`, `defaultValue`, `onValueChange`), D-156.
 */
export function RadioGroup(props: RadioGroupProps | RadioGroupRootProps) {
  return props.options !== undefined ? (
    <RadioFieldset {...(props as RadioGroupProps)} />
  ) : (
    <RadioGroupRoot {...(props as RadioGroupRootProps)} />
  );
}

/** `options` stays undefined: with options, `RadioGroup` is the props-driven one. */
export type RadioGroupRootProps = Omit<ComponentProps<typeof BaseRadioGroup>, "className"> & {
  className?: string;
  options?: undefined;
  label?: undefined;
};

function RadioGroupRoot({
  className,
  options: _options,
  label: _label,
  ...rest
}: RadioGroupRootProps) {
  return <BaseRadioGroup {...rest} className={cx("fg-radio-group", className)} />;
}

export type RadioGroupItemProps = Omit<ComponentProps<typeof BaseRadio.Root>, "className"> & {
  className?: string;
};

/** One radio of a composed `RadioGroup`; `value` is required. */
export function RadioGroupItem({ className, ...rest }: RadioGroupItemProps) {
  return (
    <BaseRadio.Root {...rest} className={cx("fg-radio-item", className)}>
      <BaseRadio.Indicator className="fg-radio-item-dot" />
    </BaseRadio.Root>
  );
}

function RadioFieldset({
  label,
  name,
  options,
  value,
  defaultValue,
  onChange,
  direction = "column",
  disabled,
  className,
}: RadioGroupProps) {
  const fallback = useId();
  const group = name ?? fallback;
  return (
    <fieldset
      className={cx("fg-radios", direction === "row" && "fg-radios-row", className)}
      disabled={disabled}
    >
      <legend className="fg-field-label">{label}</legend>
      <div className="fg-radios-list">
        {options.map((o) => (
          <label key={o.value} className="fg-radio">
            <input
              type="radio"
              className="fg-radio-input"
              name={group}
              value={o.value}
              disabled={o.disabled}
              {...(value !== undefined
                ? { checked: value === o.value, onChange: () => onChange?.(o.value) }
                : {
                    defaultChecked: defaultValue === o.value,
                    onChange: () => onChange?.(o.value),
                  })}
            />
            <span className="fg-radio-text">
              <span>{o.label}</span>
              {o.hint ? <span className="fg-radio-hint">{o.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Names an option whose label is only an icon. */
  ariaLabel?: string;
}

export interface SegmentedProps extends Omit<
  SegmentedRootProps,
  | "options"
  | "label"
  | "value"
  | "defaultValue"
  | "onChange"
  | "iconOnly"
  | "className"
  | "children"
> {
  /** Names the group for assistive technology, e.g. "View". */
  label: string;
  options: ReadonlyArray<SegmentedOption>;
  value: string;
  onChange: (value: string) => void;
  /** Square segments for icon-only options. */
  iconOnly?: boolean;
  className?: string;
}

/** `options` stays undefined: with options, `Segmented` is the props-driven one. */
export type SegmentedRootProps = Omit<
  ToggleGroupProps,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "onChange"
  | "multiple"
  | "type"
  | "variant"
  | "size"
  | "label"
> & {
  options?: undefined;
  /** Names the group for assistive technology. */
  label?: string;
  /** The chosen segment's `value`. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  iconOnly?: boolean;
};

/**
 * A switch between a few views or modes of the same thing: the chosen segment is filled in ink.
 * With `options`, the props-driven one; without, the root of `SegmentedItem` parts. Both are a
 * single-selection `ToggleGroup`, so the arrow keys move between the segments.
 */
export function Segmented(props: SegmentedProps | SegmentedRootProps) {
  return props.options !== undefined ? (
    <SegmentedOptions {...(props as SegmentedProps)} />
  ) : (
    <SegmentedRoot {...(props as SegmentedRootProps)} />
  );
}

function SegmentedRoot({
  options: _options,
  label,
  value,
  defaultValue,
  onChange,
  iconOnly,
  className,
  ...rest
}: SegmentedRootProps) {
  const [chosen, setChosen] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  return (
    <ToggleGroup
      data-slot="segmented"
      aria-label={label}
      {...rest}
      value={chosen === "" ? [] : [chosen]}
      // Pressing the chosen segment again keeps it chosen: a segmented control always has one.
      onValueChange={(next) => next[0] !== undefined && setChosen(next[0])}
      className={cx("fg-seg", iconOnly && "fg-seg-icons", className)}
    />
  );
}

export type SegmentedItemProps = ToggleGroupItemProps;

/** One segment of a composed `Segmented`; `value` is required. */
export function SegmentedItem({ className, ...rest }: SegmentedItemProps) {
  return (
    <ToggleGroupItem
      data-slot="segmented-item"
      {...rest}
      className={cx("fg-seg-item", className)}
    />
  );
}

function SegmentedOptions({
  label,
  options,
  value,
  onChange,
  iconOnly,
  className,
  ...rest
}: SegmentedProps) {
  return (
    <SegmentedRoot
      {...rest}
      label={label}
      value={value}
      onChange={onChange}
      iconOnly={iconOnly}
      className={className}
    >
      {options.map((o) => (
        <SegmentedItem key={o.value} value={o.value} aria-label={o.ariaLabel}>
          {o.label}
        </SegmentedItem>
      ))}
    </SegmentedRoot>
  );
}
