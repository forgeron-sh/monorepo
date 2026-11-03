import { AppShell, Badge, Button, Logo, Nav, Sidebar, type NavItem } from "@forgeron/ui";
import { useEffect, useState, type ReactNode } from "react";
import type { WorkspaceInfo } from "../workspace";
import { canSee } from "./access";
import { routes } from "./routes";

// The layout of every screen outside the settings area: the sidebar built from the route table, and the
// content. A page is drawn inside `children`; it never draws the sidebar.

export interface AppLayoutProps {
  ws: WorkspaceInfo;
  /** The path being shown, to tell the current item. */
  pathname: string;
  go: (href: string) => void;
  /** Counts shown as a badge, by route path (pending approvals). */
  badges?: Readonly<Record<string, number>>;
  children?: ReactNode;
}

/** The sidebar items a person may use, in table order; one item is current when its path is the page or its parent. */
function navItems(
  ws: WorkspaceInfo,
  pathname: string,
  badges: Readonly<Record<string, number>> = {},
): NavItem[] {
  return routes
    .filter((r) => r.nav && canSee(r.access, ws.person))
    .map((r) => {
      const current = r.path === "/" ? pathname === "/" : pathname.startsWith(r.path);
      const badge = badges[r.path];
      return {
        id: r.path,
        label: r.nav!.label,
        href: r.path,
        current,
        ...(badge ? { badge } : {}),
      };
    });
}

export function AppLayout({ ws, pathname, go, badges, children }: AppLayoutProps) {
  // The phone menu is open for the screen it was opened on: moving to another one closes it.
  const [openOn, setOpenOn] = useState<string>();
  const menuOpen = openOn === pathname;
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(undefined);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const items = navItems(ws, pathname, badges);
  const settings: NavItem[] = ws.person.admin
    ? [
        {
          id: "/settings",
          label: "Settings",
          href: "/settings",
          current: pathname.startsWith("/settings"),
        },
      ]
    : [];

  const sidebar = (
    <Sidebar
      header={
        <div className="fc-brand">
          <Logo size={20} />
          <div className="fc-workspace">
            <span className="fc-caption" style={{ margin: 0 }}>
              Workspace
            </span>
            <span className="fc-workspace-name" title={ws.workspace}>
              {ws.workspace}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="fc-person">
          <span className="fc-person-email" title={ws.person.email}>
            {ws.person.email}
          </span>
          <span className="fc-person-roles">
            {ws.person.roles.length ? (
              ws.person.roles.map((r) => (
                <Badge key={r} tone={r === "admin" ? "strong" : "neutral"}>
                  {r}
                </Badge>
              ))
            ) : (
              <Badge>no role</Badge>
            )}
          </span>
          <div>
            <Button size="sm" href="/auth/logout">
              Sign out
            </Button>
          </div>
        </div>
      }
    >
      <Nav label="Console" items={[...items, ...settings]} onNavigate={(href) => go(href)} />
    </Sidebar>
  );

  return (
    <AppShell
      sidebar={sidebar}
      topbar={<Logo size={18} />}
      menuOpen={menuOpen}
      onMenuToggle={() => setOpenOn(menuOpen ? undefined : pathname)}
    >
      {children}
    </AppShell>
  );
}
