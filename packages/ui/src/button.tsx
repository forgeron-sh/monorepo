import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

interface ButtonBase {
  /** `primary` = plein en `inverse` (une seule action principale par vue). */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Raccourci clavier affiché à droite, ex. "⌘K". */
  kbd?: string;
  children?: ReactNode;
}

export type ButtonProps = ButtonBase &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  );

/** Bouton, ou lien mis en forme de bouton quand `href` est fourni. */
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
