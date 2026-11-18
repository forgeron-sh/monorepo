import type { IconDefinition } from "@forgeron/icons";
import { Icon as PixelIcon } from "@forgeron/icons/react";
import { cx } from "./cx";

export interface IconProps {
  /** An icon of `@forgeron/icons`, e.g. `CloudIcon`. A stub (not drawn yet) renders nothing. */
  icon: IconDefinition;
  /** In px; a multiple of 12 keeps every pixel whole. */
  size?: number;
  /** `duo` (default): secondary pixels in ember; `mono`: one tone. */
  variant?: "mono" | "duo";
  /** Gives the icon a name for assistive technology; without it the icon is decorative. */
  title?: string;
  className?: string;
}

/**
 * A pixel icon in the text color, its secondary pixels in `accent`, in a square box that never
 * shrinks.
 */
export function Icon({ icon, size = 24, variant = "duo", title, className }: IconProps) {
  return (
    <span className={cx("fg-icon", className)} style={{ width: size, height: size }}>
      <PixelIcon
        icon={icon}
        size={size}
        variant={variant}
        secondaryColor="var(--accent)"
        secondaryOpacity={1}
        {...(title ? { title } : {})}
      />
    </span>
  );
}
