import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

interface ButtonBase {
  /** `primary` = filled in `inverse` (one primary action per view). */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Keyboard shortcut shown on the right, e.g. "⌘K". */
  kbd?: string;
  children?: ReactNode;
}

export type ButtonProps = ButtonBase &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  );

/** Button, or a link styled as a button when `href` is provided. */
export function Button({
  variant = "secondary",
  size = "md",
  kbd,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx("fg-btn", `fg-btn-${variant}`, size !== "md" && `fg-btn-${size}`, className);
  const content = (
    <>
      {children}
      {kbd ? (
        <span className="fg-btn-kbd" aria-hidden="true">
          {kbd}
        </span>
      ) : null}
    </>
  );
  if (rest.href !== undefined) {
    return (
      <a {...rest} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
