import type { MouseEvent, ReactNode } from "react";
import { cx } from "./cx";

export interface SettingsGroupProps {
  title?: ReactNode;
  description?: ReactNode;
  /** A danger zone: a `danger` outline and title. Last on the page. */
  tone?: "default" | "danger";
  className?: string;
  /** The rows. */
  children?: ReactNode;
}

/** A titled card of rows: one group of a settings page. */
export function SettingsGroup({
  title,
  description,
  tone = "default",
  className,
  children,
}: SettingsGroupProps) {
  return (
    <section className={cx("fg-sgroup", tone === "danger" && "fg-sgroup-danger", className)}>
      {title || description ? (
        <header className="fg-sgroup-head">
          {title ? <h2 className="fg-sgroup-title">{title}</h2> : null}
          {description ? <p className="fg-sgroup-desc">{description}</p> : null}
        </header>
      ) : null}
      <div className="fg-sgroup-card">{children}</div>
    </section>
  );
}

export interface SettingsRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** The control, right: a button, a switch, a value, a select. */
  children?: ReactNode;
  /** Present: the whole row is a link to a sub-page and ends with a chevron. */
  href?: string;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** The value shown before the chevron of a link row. */
  value?: ReactNode;
}

const plainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** A row of a settings group: label and description left, control right; a link row ends with a chevron. */
export function SettingsRow({
  label,
  description,
  children,
  href,
  onNavigate,
  value,
}: SettingsRowProps) {
  const text = (
    <span className="fg-srow-text">
      <span className="fg-srow-label">{label}</span>
      {description ? <span className="fg-srow-desc">{description}</span> : null}
    </span>
  );
  if (href !== undefined) {
    return (
      <a
        className="fg-srow fg-srow-link"
        href={href}
        onClick={
          onNavigate
            ? (e) => {
                if (!plainClick(e)) return;
                e.preventDefault();
                onNavigate(href, e);
              }
            : undefined
        }
      >
        {text}
        <span className="fg-srow-control">
          {value ? <span className="fg-srow-value">{value}</span> : null}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </a>
    );
  }
  return (
    <div className="fg-srow">
      {text}
      {children ? <div className="fg-srow-control">{children}</div> : null}
    </div>
  );
}
