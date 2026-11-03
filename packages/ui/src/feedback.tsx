import type { ReactNode } from "react";
import { cx } from "./cx";

export interface NoticeProps {
  tone?: "info" | "success" | "warning" | "danger";
  title?: ReactNode;
  /** A button or link at the end: the thing to do next. */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const TONE_WORD = { info: "Note", success: "Done", warning: "Warning", danger: "Error" } as const;

/** A message in the flow of the page. The state always comes with a word, never a color alone. */
export function Notice({ tone = "info", title, action, className, children }: NoticeProps) {
  return (
    <div
      className={cx("fg-notice", `fg-notice-${tone}`, className)}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
    >
      <span className="fg-notice-mark">{TONE_WORD[tone]}</span>
      <div className="fg-notice-body">
        {title ? <p className="fg-notice-title">{title}</p> : null}
        {children ? <div className="fg-notice-text">{children}</div> : null}
      </div>
      {action ? <div className="fg-notice-action">{action}</div> : null}
    </div>
  );
}

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** The one thing to do about it. */
  action?: ReactNode;
  className?: string;
}

/** What a list shows when there is nothing in it yet, and what to do about it. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx("fg-empty", className)}>
      <p className="fg-empty-title">{title}</p>
      {description ? <p className="fg-empty-text">{description}</p> : null}
      {action ? <div className="fg-empty-action">{action}</div> : null}
    </div>
  );
}

export interface SpinnerProps {
  /** Said to assistive technology and shown beside the mark. */
  label?: string;
  className?: string;
}

/** A turning square: the loading state. Nothing bounces. */
export function Spinner({ label = "Loading", className }: SpinnerProps) {
  return (
    <span className={cx("fg-spinner", className)} role="status">
      <span className="fg-spinner-mark" aria-hidden="true" />
      <span className="fg-spinner-label">{label}</span>
    </span>
  );
}
