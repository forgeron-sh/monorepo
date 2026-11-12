import { AppShell, Logo, Nav, Sidebar, type NavItem } from "@forgeron/ui";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { WorkspaceInfo } from "../workspace";
import { canSee } from "./access";
import { PersonMenu, WorkspaceSwitcher } from "./chrome";
import { routes, type NavGroup } from "./routes";
import { SearchDialog, type Destination } from "./search-dialog";
import { useShortcuts } from "./shortcuts";

// The layout of every screen outside the settings area: the sidebar built from the route table, and the
// content. A page is drawn inside `children`; it never draws the sidebar. The sidebar has the person's
// own space on top (Home, My tools, Discover), the Administration section for admins (D-128), and
// Settings at the bottom.

export interface LayoutProps {
  ws: WorkspaceInfo;
  /** The path being shown, to tell the current item. */
  pathname: string;
  go: (href: string) => void;
  /** Counts shown as a badge, by route path (pending approvals). */
  badges?: Readonly<Record<string, number>>;
  /** The screen. */
  children?: ReactNode;
}

const GROUPS: ReadonlyArray<{ id: NavGroup; heading?: string }> = [
  { id: "main" },
  { id: "admin", heading: "Administration" },
];

function navItems(
  ws: WorkspaceInfo,
  pathname: string,
  group: NavGroup,
  badges: Readonly<Record<string, number>>,
): NavItem[] {
  return routes
    .filter((r) => r.nav?.group === group && canSee(r.access, ws.person))
    .map((r) => {
      const badge = badges[r.path];
      return {
        id: r.path,
        label: r.nav!.label,
        href: r.path,
        current: r.path === "/" ? pathname === "/" : isUnder(pathname, r.path),
        ...(badge ? { badge } : {}),
      };
    });
}

/** `/admin/tools/crm` is under `/admin/tools`; `/admin/toolsx` is not. */
const isUnder = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

/** Where `g` then a letter goes, and what `/` searches: the pages this person may open. */
function useDestinations(ws: WorkspaceInfo) {
  return useMemo(() => {
    const shortcuts: Array<{ key: string; href: string }> = [];
    const destinations: Destination[] = [];
    for (const r of routes) {
      if (!canSee(r.access, ws.person)) continue;
      if (r.nav) {
        if (r.nav.shortcut) shortcuts.push({ key: r.nav.shortcut, href: r.path });
        destinations.push({
          title: r.nav.label,
          where: r.nav.group === "admin" ? "Administration" : "Go to",
          href: r.path,
        });
      } else if (r.settings) {
        destinations.push({
          title: r.settings.label,
          where: `Settings · ${GROUP_NAMES[r.settings.group]}`,
          href: r.path,
        });
      }
    }
    shortcuts.push({ key: "s", href: "/settings/profile" });
    return { shortcuts, destinations };
  }, [ws.person]);
}

export const GROUP_NAMES = {
  account: "Account",
  workspace: "Workspace",
  operations: "Operations",
} as const;

/** The phone menu, the shortcuts and the search, shared by the app and the settings layouts. */
function useChrome(ws: WorkspaceInfo, pathname: string, go: (href: string) => void) {
  // The phone menu is open for the screen it was opened on: moving to another one closes it.
  const [openOn, setOpenOn] = useState<string>();
  const menuOpen = openOn === pathname;
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(undefined);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const [searching, setSearching] = useState(false);
  const { shortcuts, destinations } = useDestinations(ws);
  useShortcuts(shortcuts, go, () => setSearching(true));
  return {
    menuOpen,
    toggleMenu: () => setOpenOn(menuOpen ? undefined : pathname),
    search: searching ? (
      <SearchDialog destinations={destinations} onGo={go} onClose={() => setSearching(false)} />
    ) : null,
    openSearch: () => setSearching(true),
  };
}

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="fc-search" onClick={onClick}>
      <span>Search</span>
      <kbd className="fc-kbd">/</kbd>
    </button>
  );
}

/** The shell around a sidebar: skip link, phone drawer, content, the search dialog. */
export function ChromeShell({
  ws,
  pathname,
  go,
  sidebar,
  children,
}: {
  ws: WorkspaceInfo;
  pathname: string;
  go: (href: string) => void;
  sidebar: (chrome: { openSearch: () => void }) => ReactNode;
  children?: ReactNode;
}) {
  const chrome = useChrome(ws, pathname, go);
  return (
    <>
      <AppShell
        sidebar={sidebar(chrome)}
        topbar={
          <span className="fc-topbar-name">
            <Logo variant="symbol" size={18} />
            <span>{ws.workspace}</span>
          </span>
        }
        menuOpen={chrome.menuOpen}
        onMenuToggle={chrome.toggleMenu}
      >
        {children}
      </AppShell>
      {chrome.search}
    </>
  );
}

export function AppLayout({ ws, pathname, go, badges = {}, children }: LayoutProps) {
  return (
    <ChromeShell
      ws={ws}
      pathname={pathname}
      go={go}
      sidebar={({ openSearch }) => (
        <Sidebar
          header={<WorkspaceSwitcher ws={ws} go={go} />}
          footer={<PersonMenu ws={ws} go={go} />}
        >
          <SearchButton onClick={openSearch} />
          {GROUPS.map((group) => {
            const items = navItems(ws, pathname, group.id, badges);
            return items.length ? (
              <Nav
                key={group.id}
                label={group.heading ?? "Console"}
                {...(group.heading ? { heading: group.heading } : {})}
                items={items}
                onNavigate={(href) => go(href)}
              />
            ) : null;
          })}
          <Nav
            label="Settings"
            className="fc-nav-end"
            items={[
              {
                id: "settings",
                label: "Settings",
                href: "/settings/profile",
                current: isUnder(pathname, "/settings"),
                icon: <Gear />,
              },
            ]}
            onNavigate={(href) => go(href)}
          />
        </Sidebar>
      )}
    >
      {children}
    </ChromeShell>
  );
}

const Gear = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);
