import type { IconDefinition } from "@forgeron/icons";
import { cx } from "./cx";
import { Icon } from "./icon";

export interface LogoTileProps {
  /** A pixel brand mark of `@forgeron/icons`, drawn at 16px in one tone. */
  icon?: IconDefinition;
  /** Without an icon: the name, whose first letter is drawn in the pixel face. */
  name?: string;
  className?: string;
}

/** A product's logo in a 28px square tile: its pixel mark, or its initial. Decorative. */
export function LogoTile({ icon, name = "", className }: LogoTileProps) {
  return (
    <span className={cx("fg-logo-tile", className)} aria-hidden="true">
      {icon ? (
        <Icon icon={icon} size={16} variant="mono" />
      ) : (
        <span className="fg-logo-tile-initial">{name.slice(0, 1)}</span>
      )}
    </span>
  );
}
