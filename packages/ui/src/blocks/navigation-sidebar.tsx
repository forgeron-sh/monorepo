// The left column of an app, after Tasks: the app switcher and its icon buttons on top, the
// primary links (Inbox with its count), sections that fold under a mono heading, nested links
// under a team, and a footer. Controlled by the current href: the matching link carries
// `aria-current="page"` and the ember bar.

import type { IconDefinition } from "@forgeron/icons";
import { ArrowDown01Icon } from "@forgeron/icons";
import type { MouseEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { AppTile } from "../identity";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";

export interface AppSidebarLink {
  /** Where the link goes; compared with `current`. Unused on a row with `items`: it only folds. */
  href?: string;
  label: string;
  icon?: IconDefinition;
  /** A letter in a framed square in place of the icon: a team. */
  initial?: string;
  /**
   * An ember count after the label, only for what waits on the user (unread notifications), never
   * a total. Absent or 0 hides it.
   */
  count?: number;
  /** Links nested under this one (a team's Issues, Projects, Views); the row then folds them. */
  items?: ReadonlyArray<AppSidebarLink>;
  /** Whether the nested links show at first. */
  defaultOpen?: boolean;
}

export interface AppSidebarSection {
  /** The mono heading: Workspace, Your teams. */
  label: string;
  items: ReadonlyArray<AppSidebarLink>;
  /** Whether the heading folds the section; true by default. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface AppSidebarApp {
  name: string;
  icon: IconDefinition;
}

export interface AppSidebarProps {
  /** The app on top: its tile and name. */
  app: AppSidebarApp;
  /** The other apps and workspace actions: the switcher opens them as a menu. */
  appMenu?: ReadonlyArray<ActionMenuEntry>;
  onAppMenuSelect?: (id: string) => void;
  /** Icon buttons after the switcher: search, new. */
  actions?: ReactNode;
  /** The primary links, above the sections: Inbox, My issues. */
  items: ReadonlyArray<AppSidebarLink>;
  sections?: ReadonlyArray<AppSidebarSection>;
  /** The href of the page shown. */
  current?: string;
  /** On a click on a link, for client-side routing: call `event.preventDefault()` to stay. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** At the bottom: help, the viewer's avatar. */
  footer?: ReactNode;
  /** Names the navigation landmark; `<app> navigation` by default. */
  label?: string;
  className?: string;
}

/** The left column of an app: switcher, links, folding sections, footer. */
export function AppSidebar({
  app,
  appMenu,
  onAppMenuSelect,
  actions,
  items,
  sections = [],
  current,
  onNavigate,
  footer,
  label,
  className,
}: AppSidebarProps) {
  const ctx: LinkContext = {
    ...(current !== undefined ? { current } : {}),
    ...(onNavigate ? { onNavigate } : {}),
  };
  const switcher = (
    <button type="button" className="fg-aside-switcher">
      <AppTile icon={app.icon} size={20} />
      <span className="fg-aside-app">{app.name}</span>
      <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-aside-chev" />
    </button>
  );
  return (
    <div className={cx("fg-aside", className)}>
      <div className="fg-aside-head">
        {appMenu ? (
          <ActionMenu
            trigger={switcher}
            items={appMenu}
            onSelect={(id) => onAppMenuSelect?.(id)}
            label="Switch app"
          />
        ) : (
          <span className="fg-aside-switcher fg-aside-static">
            <AppTile icon={app.icon} size={20} />
            <span className="fg-aside-app">{app.name}</span>
          </span>
        )}
        {actions}
      </div>
      <nav className="fg-aside-nav" aria-label={label ?? `${app.name} navigation`}>
        <Links items={items} ctx={ctx} />
        {sections.map((s, i) => (
          <Section key={`${s.label}-${i}`} section={s} ctx={ctx} />
        ))}
      </nav>
      {footer ? <div className="fg-aside-foot">{footer}</div> : null}
    </div>
  );
}

interface LinkContext {
  current?: string;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

function Section({ section, ctx }: { section: AppSidebarSection; ctx: LinkContext }) {
  const id = useId();
  const [open, setOpen] = useState(section.defaultOpen ?? true);
  const collapsible = section.collapsible ?? true;
  return (
    <div className="fg-aside-sec">
      {collapsible ? (
        <button
          type="button"
          className="fg-aside-h"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {section.label}
          <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-aside-caret" />
        </button>
      ) : (
        <div className="fg-aside-h" id={`${id}-h`}>
          {section.label}
        </div>
      )}
      <div id={id} hidden={!open}>
        <Links items={section.items} ctx={ctx} />
      </div>
    </div>
  );
}

function Links({
  items,
  ctx,
  nested,
}: {
  items: ReadonlyArray<AppSidebarLink>;
  ctx: LinkContext;
  nested?: boolean;
}) {
  return (
    <ul className="fg-aside-list">
      {items.map((item, i) => (
        <li key={`${item.href ?? item.label}-${i}`}>
          {item.items ? (
            <Fold item={item} ctx={ctx} />
          ) : (
            <LinkRow item={item} ctx={ctx} {...(nested ? { nested } : {})} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Lead({ item }: { item: AppSidebarLink }) {
  if (item.initial)
    return (
      <span className="fg-aside-initial" aria-hidden="true">
        {item.initial.slice(0, 1)}
      </span>
    );
  return item.icon ? <Icon icon={item.icon} size={12} variant="mono" /> : null;
}

function LinkRow({
  item,
  ctx,
  nested,
}: {
  item: AppSidebarLink;
  ctx: LinkContext;
  nested?: boolean;
}) {
  const here = item.href !== undefined && item.href === ctx.current;
  return (
    <a
      className={cx("fg-aside-item", nested && "fg-aside-sub")}
      href={item.href}
      {...(here ? { "aria-current": "page" as const } : {})}
      onClick={(event) => {
        if (item.href !== undefined) ctx.onNavigate?.(item.href, event);
      }}
    >
      <Lead item={item} />
      <span className="fg-aside-label">{item.label}</span>
      {item.count ? <span className="fg-aside-badge">{item.count}</span> : null}
    </a>
  );
}

function Fold({ item, ctx }: { item: AppSidebarLink; ctx: LinkContext }) {
  const id = useId();
  const [open, setOpen] = useState(item.defaultOpen ?? true);
  return (
    <>
      <button
        type="button"
        className="fg-aside-item"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Lead item={item} />
        <span className="fg-aside-label">{item.label}</span>
        {item.count ? <span className="fg-aside-badge">{item.count}</span> : null}
        <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-aside-caret" />
      </button>
      <div id={id} hidden={!open}>
        <Links items={item.items ?? []} ctx={ctx} nested />
      </div>
    </>
  );
}
