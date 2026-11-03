import type { ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "./cx";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: ReadonlyArray<SelectOption>;
  /** Unselectable first entry shown while `value` is empty. */
  placeholder?: ReactNode;
}

/** Native select (keyboard and mobile behaviour for free), 32px, sharp corners. */
export function Select({ options, placeholder, className, ...rest }: SelectProps) {
  const controlled = rest.value !== undefined;
  return (
    <select
      {...rest}
      className={cx("fg-select", className)}
      {...(placeholder !== undefined && !controlled && rest.defaultValue === undefined
        ? { defaultValue: "" }
        : {})}
    >
      {placeholder !== undefined ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
