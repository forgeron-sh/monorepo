import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

/** A standalone text link: mono, uppercase, ember on hover ("Read the SDK →"). */
export function Link({ className, children, ...rest }: LinkProps) {
  return (
    <a data-slot="link" {...rest} className={cx("fg-link", className)}>
      {children}
    </a>
  );
}
