import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cx } from "./cx";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {
  label: ReactNode;
}

/** An on/off setting that applies at once: a sharp track whose square knob lights in ember. */
export function Switch({ label, className, ...rest }: SwitchProps) {
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

/** One choice among a few, all visible: a fieldset of square radios, the chosen one filled with a square. */
export function RadioGroup({
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

export interface SegmentedProps {
  /** Names the group for assistive technology, e.g. "View". */
  label: string;
  options: ReadonlyArray<SegmentedOption>;
  value: string;
  onChange: (value: string) => void;
  /** Square segments for icon-only options. */
  iconOnly?: boolean;
  className?: string;
}

/** A switch between a few views or modes of the same thing: the chosen segment is filled in ink. */
export function Segmented({
  label,
  options,
  value,
  onChange,
  iconOnly,
  className,
}: SegmentedProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("fg-seg", iconOnly && "fg-seg-icons", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="fg-seg-item"
          aria-pressed={o.value === value}
          aria-label={o.ariaLabel}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
