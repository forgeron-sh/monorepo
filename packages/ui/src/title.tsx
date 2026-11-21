import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { renderPart } from "./shell-part";

export interface TitleProps extends Omit<ComponentProps<"h2">, "className" | "children"> {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  /** `hero` 100px, `h2` 60px, `h3` 30px; each steps down on narrow screens, in whole pixels. */
  size?: "hero" | "h2" | "h3";
  className?: string;
  /** Hands the title's props to the one child element instead of rendering the heading. */
  asChild?: boolean;
  children: ReactNode;
}

/** A marketing heading set in the pixel font (`--font-pixel`): capitals, medium weight. */
export function Title({
  as: Tag = "h2",
  size = "h2",
  className,
  asChild,
  children,
  ...rest
}: TitleProps) {
  return renderPart(Tag, cx("fg-title", `fg-title-${size}`, className), asChild, {
    "data-slot": "title",
    ...rest,
    children,
  });
}
