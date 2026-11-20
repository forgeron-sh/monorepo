import type { ComponentProps } from "react";
import { Toggle as Base } from "@base-ui/react/toggle";
import { cx } from "./cx";

export interface ToggleStyleProps {
  /** `default` is flat; `outline` has a border. */
  variant?: "default" | "outline";
  /** `default` 32px, `sm` 28px, `lg` 40px. */
  size?: "default" | "sm" | "lg";
}

export const toggleClass = ({ variant = "default", size = "default" }: ToggleStyleProps = {}) =>
  cx(
    "fg-toggle",
    variant === "outline" && "fg-toggle-outline",
    size !== "default" && `fg-toggle-${size}`,
  );

export type ToggleProps = Omit<ComponentProps<typeof Base>, "className"> &
  ToggleStyleProps & { className?: string };

/** A button that stays pressed (shadcn's Toggle on Base UI): `pressed`, `defaultPressed`, `onPressedChange`. */
export function Toggle({ variant, size, className, ...rest }: ToggleProps) {
  return <Base {...rest} className={cx(toggleClass({ variant, size }), className)} />;
}
