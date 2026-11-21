import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export interface MarkBadgeProps extends Omit<ComponentProps<"span">, "className" | "children"> {
  /**
   * A small square mark on the left, 18 × 22, usually a pixel drawing (an SVG fills it). From an
   * Astro page, pass it in the `mark` slot.
   */
  mark?: ReactNode;
  /** The words, in mono capitals. */
  children: ReactNode;
  className?: string;
}

/** An outlined mono pill led by a small mark, above a hero title: "▣ Not backed by …". */
export function MarkBadge({ mark, children, className, ...rest }: MarkBadgeProps) {
  return (
    <span data-slot="mark-badge" {...rest} className={cx("fg-mark-badge text-eyebrow", className)}>
      {mark ? <span className="fg-mark-badge-mark">{mark}</span> : null}
      {children}
    </span>
  );
}
