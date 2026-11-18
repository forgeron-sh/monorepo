// The top bar of a list view: where it is (a breadcrumb or a title), the views of the list (All
// issues, Active, Backlog), and on the right the filter, the display options and the main action.

import type { ReactNode } from "react";
import { cx } from "../cx";
import { Breadcrumb, type BreadcrumbItem } from "../identity";

export interface ViewTab {
  value: string;
  label: string;
  /** How many records the view holds: shown on the current tab only. */
  count?: number;
  /** A link to the view; without it the tab is a button that calls `onTabChange`. */
  href?: string;
}

export interface ViewHeaderProps {
  /** Where the view sits: the team, then the page. Takes the place of `title`. */
  breadcrumb?: ReadonlyArray<BreadcrumbItem>;
  /** The name of the view, when there is no breadcrumb. */
  title?: ReactNode;
  tabs?: ReadonlyArray<ViewTab>;
  /** The current tab's `value`. */
  tab?: string;
  onTabChange?: (value: string) => void;
  /** The layouts as icons, before the filter: a `LayoutSwitch`. */
  switcher?: ReactNode;
  /** The filter button: a `FilterMenu`. */
  filter?: ReactNode;
  /** The display button: a `DisplayMenu`. */
  display?: ReactNode;
  /** The main action: a primary `Button` such as "New issue" with its shortcut. */
  action?: ReactNode;
  className?: string;
}

/**
 * The bar above a list: title, view tabs, then filter, display and the main action on the right.
 * On a phone the tabs move to a second line and scroll sideways.
 */
export function ViewHeader({
  breadcrumb,
  title,
  tabs = [],
  tab,
  onTabChange,
  switcher,
  filter,
  display,
  action,
  className,
}: ViewHeaderProps) {
  return (
    <header className={cx("fg-vhead", className)}>
      <div className="fg-vhead-bar">
        <div className="fg-vhead-title">
          {breadcrumb ? (
            <Breadcrumb items={breadcrumb} />
          ) : title ? (
            <h2 className="fg-vhead-name">{title}</h2>
          ) : null}
        </div>
        {tabs.length > 0 ? (
          <nav className="fg-vhead-tabs" aria-label="Views">
            {tabs.map((t) => {
              const current = t.value === tab;
              const content = (
                <>
                  {t.label}
                  {current && t.count !== undefined ? (
                    <span className="fg-vhead-count">{t.count}</span>
                  ) : null}
                </>
              );
              return t.href !== undefined ? (
                <a
                  key={t.value}
                  className="fg-vhead-tab"
                  href={t.href}
                  aria-current={current ? "page" : undefined}
                >
                  {content}
                </a>
              ) : (
                <button
                  key={t.value}
                  type="button"
                  className="fg-vhead-tab"
                  aria-pressed={current}
                  onClick={() => onTabChange?.(t.value)}
                >
                  {content}
                </button>
              );
            })}
          </nav>
        ) : null}
        {switcher || filter || display || action ? (
          <div className="fg-vhead-actions">
            {switcher}
            {filter}
            {display}
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}
