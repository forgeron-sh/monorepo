import type { ReactNode } from "react";
import { cx } from "./cx";

export interface SoonTagProps {
  /** `Soon` by default. */
  children?: ReactNode;
  className?: string;
}

/** A small dashed tag in the bitmap face next to what is announced but not there yet: `Soon`. */
export function SoonTag({ children = "Soon", className }: SoonTagProps) {
  return <span className={cx("fg-soon text-bit", className)}>{children}</span>;
}
