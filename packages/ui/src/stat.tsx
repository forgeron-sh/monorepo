import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export interface StatProps extends Omit<ComponentProps<"dl">, "className" | "children"> {
  label: ReactNode;
  value: ReactNode;
  /** Context under the value, e.g. "last 7 days". */
  hint?: ReactNode;
  className?: string;
}

/** One figure with its label. */
export function Stat({ label, value, hint, className, ...rest }: StatProps) {
  return (
    <dl data-slot="stat" {...rest} className={cx("fg-stat", className)}>
      <dt className="fg-stat-label">{label}</dt>
      <dd className="fg-stat-value">{value}</dd>
      {hint ? <dd className="fg-stat-hint">{hint}</dd> : null}
    </dl>
  );
}
