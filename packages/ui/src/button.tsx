import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { Led } from "./led";

interface ButtonBase {
  /**
   * `primary`: filled in ember, one per view; `secondary` (default): outlined; `ink`: filled in
   * `ink`, a strong action that is not the primary one; `ghost`: no outline; `danger`: destructive.
   */
  variant?: "primary" | "secondary" | "ink" | "ghost" | "danger";
  /** `sm` 30px, `md` 32px (the app's density), `lg` 40px (the site). */
  size?: "sm" | "md" | "lg";
  /** The square marker of the lab language before the label ("■ Get started"). */
  marker?: boolean;
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
  marker,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx("fg-btn", `fg-btn-${variant}`, size !== "md" && `fg-btn-${size}`, className);
  const content = (
    <>
      {marker ? <Led tone="current" /> : null}
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
