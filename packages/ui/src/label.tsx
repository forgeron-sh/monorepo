import type { ReactNode } from "react";
import { cx } from "./cx";

export interface LabelProps {
  className?: string;
  children: ReactNode;
}

/** Eyebrow for a section or block: mono capitals (`text-eyebrow`), `ink-muted`. */
export function Label({ className, children }: LabelProps) {
  return <span className={cx("fg-label-eyebrow", "text-eyebrow", className)}>{children}</span>;
}
