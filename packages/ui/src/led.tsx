import type { ComponentProps } from "react";
import { cx } from "./cx";

export interface LedProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /**
   * `neutral` (`ink-dim`), a state (`success`, `warning`, `danger`), `accent` (ember: what is
   * active or hot), or `current`: the text color, the square marker of a button or a pin.
   */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent" | "current";
  /** Said to assistive technology when the LED stands alone; without it the LED is decorative. */
  label?: string;
  className?: string;
}

/** A 6px square: a status LED next to its word, or the square marker of the lab language. */
export function Led({ tone = "neutral", label, className, ...rest }: LedProps) {
  return (
    <span
      data-slot="led"
      {...rest}
      className={cx("fg-led", tone !== "neutral" && `fg-led-${tone}`, className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
