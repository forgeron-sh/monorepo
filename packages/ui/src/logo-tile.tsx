import type { IconDefinition } from "@forgeron/icons";
import type { ComponentProps } from "react";
import { cx } from "./cx";
import { Icon } from "./icon";

export interface LogoTileProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /** A pixel brand mark of `@forgeron/icons`, drawn at 16px in one tone. */
  icon?: IconDefinition;
  /** Without an icon: the name, whose first letter is drawn in the pixel face. */
  name?: string;
  className?: string;
}

/** A product's logo in a 28px square tile: its pixel mark, or its initial. Decorative. */
export function LogoTile({ icon, name = "", className, ...rest }: LogoTileProps) {
  return (
    <span
      data-slot="logo-tile"
      aria-hidden="true"
      {...rest}
      className={cx("fg-logo-tile", className)}
    >
      {icon ? (
        <Icon icon={icon} size={16} variant="mono" />
      ) : (
        <span className="fg-logo-tile-initial">{name.slice(0, 1)}</span>
      )}
    </span>
  );
}
