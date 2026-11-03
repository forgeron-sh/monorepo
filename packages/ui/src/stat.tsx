import type { ReactNode } from "react";
import { cx } from "./cx";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Context under the value, e.g. "last 7 days". */
  hint?: ReactNode;
  className?: string;
}

/** One figure with its label. */
export function Stat({ label, value, hint, className }: StatProps) {
  return (
    <dl className={cx("fg-stat", className)}>
      <dt className="fg-stat-label">{label}</dt>
      <dd className="fg-stat-value">{value}</dd>
      {hint ? <dd className="fg-stat-hint">{hint}</dd> : null}
    </dl>
  );
}
