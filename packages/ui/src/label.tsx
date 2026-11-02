import type { ReactNode } from "react";
import { cx } from "./cx";

export interface LabelProps {
  className?: string;
  children: ReactNode;
}

/** Surtitre de section ou de bloc : mono, capitales, `ink-muted`. */
export function Label({ className, children }: LabelProps) {
  return <span className={cx("fg-label-eyebrow", "text-eyebrow", className)}>{children}</span>;
}
