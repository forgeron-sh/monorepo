import type { ReactNode } from "react";
import { cx } from "./cx";

export interface CommandProps {
  /** Shown before the command in ember, not part of it; `$` by default. */
  prompt?: string;
  /** `false`: inline in running text, without the frame. */
  framed?: boolean;
  className?: string;
  children: ReactNode;
}

/** A command to type, `$ npx forgeron init`: framed on `bg-sunk`, or inline. */
export function Command({ prompt = "$", framed = true, className, children }: CommandProps) {
  const mark = (
    <span className="fg-cmd-prompt" aria-hidden="true">
      {prompt}
    </span>
  );
  if (!framed) {
    return (
      <code className={cx("fg-cmd-inline", className)}>
        {mark} {children}
      </code>
    );
  }
  return (
    <code className={cx("fg-cmd", className)}>
      {mark}
      {children}
    </code>
  );
}
