import type { ReactNode } from "react";
import { cx } from "./cx";

export interface ToolIconProps {
  /** The tool's name: its first letters make the mark. */
  name: string;
  size?: "md" | "lg";
  className?: string;
}

/** A square monogram. Black and white, sharp corners: a tool has no logo of its own here. */
export function ToolIcon({ name, size = "md", className }: ToolIconProps) {
  const letters = name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || "?";
  return (
    <span
      className={cx("fg-toolicon", size === "lg" && "fg-toolicon-lg", className)}
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}

export interface ToolCardProps {
  name: string;
  summary: string;
  /** Where the card goes: the tool's page. The whole title is the link. */
  href: string;
  onNavigate?: (href: string) => void;
  /** Small facts under the summary: version, interfaces. */
  meta?: ReactNode;
  /** The one thing to do from here: Open, Connect, or what to ask for. */
  footer?: ReactNode;
  className?: string;
}

/** A tool in a grid: icon, name, summary, facts, and what to do next. */
export function ToolCard({
  name,
  summary,
  href,
  onNavigate,
  meta,
  footer,
  className,
}: ToolCardProps) {
  return (
    <li className={cx("fg-toolcard", className)}>
      <div className="fg-toolcard-top">
        <ToolIcon name={name} />
        <div className="fg-toolcard-titles">
          <h3 className="fg-toolcard-name">
            <a
              href={href}
              className="fg-toolcard-link"
              onClick={(event) => {
                if (
                  !onNavigate ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                onNavigate(href);
              }}
            >
              {name}
            </a>
          </h3>
          {meta ? <div className="fg-toolcard-meta">{meta}</div> : null}
        </div>
      </div>
      <p className="fg-toolcard-summary">{summary}</p>
      {footer ? <div className="fg-toolcard-footer">{footer}</div> : null}
    </li>
  );
}

export interface DetailItem {
  label: string;
  value: ReactNode;
}

export interface DetailListProps {
  items: ReadonlyArray<DetailItem>;
  className?: string;
}

/** Label and value pairs: the right column of a tool card. */
export function DetailList({ items, className }: DetailListProps) {
  return (
    <dl className={cx("fg-details", className)}>
      {items.map((item) => (
        <div key={item.label} className="fg-details-row">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
