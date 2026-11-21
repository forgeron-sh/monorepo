import type { ComponentProps } from "react";
import { cx } from "./cx";
import { renderPart } from "./shell-part";

export interface SoonTagProps extends ComponentProps<"span"> {
  /** `Soon` by default. */
  children?: ComponentProps<"span">["children"];
  /** The one child element takes the tag's class and props (shadcn's `asChild`). */
  asChild?: boolean;
}

/** A small dashed tag in the bitmap face next to what is announced but not there yet: `Soon`. */
export function SoonTag({ children = "Soon", className, asChild, ...rest }: SoonTagProps) {
  return renderPart("span", cx("fg-soon text-bit", className), asChild, {
    ...rest,
    "data-slot": "soon-tag",
    children,
  });
}
