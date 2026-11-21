import type { ComponentProps } from "react";
import { cx } from "./cx";

export interface CommandLineProps extends ComponentProps<"code"> {
  /** Shown before the command in ember, not part of it; `$` by default. */
  prompt?: string;
  /** `false`: inline in running text, without the frame. */
  framed?: boolean;
  children: ComponentProps<"code">["children"];
}

/** A command to type, `$ npx forgeron init`: framed on `bg-sunk`, or inline. */
export function CommandLine({
  prompt = "$",
  framed = true,
  className,
  children,
  ...rest
}: CommandLineProps) {
  const mark = (
    <span className="fg-cmd-prompt" aria-hidden="true">
      {prompt}
    </span>
  );
  if (!framed) {
    return (
      <code {...rest} data-slot="command-line" className={cx("fg-cmd-inline", className)}>
        {mark} {children}
      </code>
    );
  }
  return (
    <code {...rest} data-slot="command-line" className={cx("fg-cmd", className)}>
      {mark}
      {children}
    </code>
  );
}
