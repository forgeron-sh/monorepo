import type { MouseEvent, ReactNode } from "react";
import { cx } from "./cx";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** The page being shown: gets `aria-current="page"` and the `inverse` selection. */
  current?: boolean;
  /** A count or a state next to the label, e.g. pending approvals. */
  badge?: ReactNode;
}

export interface NavProps {
  /** Accessible name of the landmark. */
  label: string;
  items: ReadonlyArray<NavItem>;
  /** Called on a plain click, so the caller can route without a page load; omit for normal links. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

const plainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** A vertical list of links; the current one is told by `aria-current`, not by color alone. */
export function Nav({ label, items, onNavigate, className }: NavProps) {
  return (
    <nav aria-label={label} className={cx("fg-nav", className)}>
      <ul className="fg-nav-list">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              className="fg-nav-link"
              aria-current={item.current ? "page" : undefined}
              onClick={
                onNavigate
                  ? (e) => {
                      if (!plainClick(e)) return;
                      e.preventDefault();
                      onNavigate(item.href, e);
                    }
                  : undefined
              }
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== null ? (
                <span className="fg-nav-badge">{item.badge}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface SidebarProps {
  /** Top: the workspace. */
  header?: ReactNode;
  /** Bottom: the signed-in person and sign-out. */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** The `surface` column on the left: header, navigation, footer. */
export function Sidebar({ header, footer, className, children }: SidebarProps) {
  return (
    <div className={cx("fg-sidebar", className)}>
      {header ? <div className="fg-sidebar-head">{header}</div> : null}
      <div className="fg-sidebar-body">{children}</div>
      {footer ? <div className="fg-sidebar-foot">{footer}</div> : null}
    </div>
  );
}

export interface AppShellProps {
  sidebar: ReactNode;
  /** The bar shown at phone width, where the sidebar collapses: the product name, say. */
  topbar?: ReactNode;
  /** Whether the collapsed sidebar is open (phone width only). */
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  /** The id the skip link jumps to. */
  contentId?: string;
  children?: ReactNode;
}

/** Sidebar on the left, content on `bg`, a skip link, and a menu button at phone width. */
export function AppShell({
  sidebar,
  topbar,
  menuOpen = false,
  onMenuToggle,
  contentId = "content",
  children,
}: AppShellProps) {
  return (
    <div className={cx("fg-shell", menuOpen && "fg-shell-open")}>
      <a className="fg-skip" href={`#${contentId}`}>
        Skip to content
      </a>
      <header className="fg-topbar">
        <button
          type="button"
          className="fg-btn fg-btn-ghost fg-btn-sm"
          aria-expanded={menuOpen}
          aria-controls="fg-shell-side"
          onClick={onMenuToggle}
        >
          {menuOpen ? "Close menu" : "Menu"}
        </button>
        {topbar}
      </header>
      <aside id="fg-shell-side" className="fg-shell-side">
        {sidebar}
      </aside>
      {menuOpen ? (
        <div className="fg-shell-scrim" aria-hidden="true" onClick={onMenuToggle} />
      ) : null}
      <div id={contentId} className="fg-shell-main" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
