import type { ReactNode } from "react";
import { cx } from "./cx";

export interface TitleProps {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  /** `hero` 100px, `h2` 60px, `h3` 30px; each steps down on narrow screens, in whole pixels. */
  size?: "hero" | "h2" | "h3";
  className?: string;
  children: ReactNode;
}

/** A marketing heading set in the pixel font (`--font-pixel`): capitals, medium weight. */
export function Title({ as: Tag = "h2", size = "h2", className, children }: TitleProps) {
  return <Tag className={cx("fg-title", `fg-title-${size}`, className)}>{children}</Tag>;
}
