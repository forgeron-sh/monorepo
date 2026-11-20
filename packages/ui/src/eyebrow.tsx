import type { ReactNode } from "react";
import { cx } from "./cx";

export interface EyebrowProps {
  className?: string;
  children: ReactNode;
}

/** Eyebrow for a section or block: mono capitals (`text-eyebrow`), `ink-muted`. */
export function Eyebrow({ className, children }: EyebrowProps) {
  return <span className={cx("fg-label-eyebrow", "text-eyebrow", className)}>{children}</span>;
}
