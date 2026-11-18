import { MinusSignIcon, PlusSignIcon } from "@forgeron/icons";
import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import { Icon } from "./icon";

export interface StepperProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange"> {
  /** Accessible name of the number field; the buttons read "Fewer: …" and "More: …". */
  label: string;
  /** The starting value, a whole number from 0 to 9999. */
  value: number;
}

/**
 * A whole number with a minus button on its left and a plus button on its right. The markup only:
 * the page wires the buttons (`data-step` holds -1 or 1) and reads the field.
 */
export function Stepper({ label, value, className, ...rest }: StepperProps) {
  return (
    <span {...rest} className={cx("fg-stepper", className)}>
      <button type="button" data-step="-1" aria-label={`Fewer: ${label}`}>
        <Icon icon={MinusSignIcon} size={12} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="9999"
        step="1"
        defaultValue={value}
        aria-label={label}
      />
      <button type="button" data-step="1" aria-label={`More: ${label}`}>
        <Icon icon={PlusSignIcon} size={12} />
      </button>
    </span>
  );
}
