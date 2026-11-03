import type { ReactNode } from "react";
import { cx } from "./cx";

export interface PageProps {
  title: string;
  description?: ReactNode;
  /** Right of the title, e.g. a primary `Button`. */
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** View layout: heading, optional description and actions, then the content. */
export function Page({ title, description, actions, className, children }: PageProps) {
  return (
    <main className={cx("fg-page", className)}>
      <header className="fg-page-head">
        <div className="fg-page-titles">
          <h1 className="fg-page-title">{title}</h1>
          {description ? <p className="fg-page-desc">{description}</p> : null}
        </div>
        {actions ? <div className="fg-page-actions">{actions}</div> : null}
      </header>
      <div className="fg-page-body">{children}</div>
    </main>
  );
}
