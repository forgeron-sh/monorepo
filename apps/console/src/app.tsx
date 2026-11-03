import { AppShell, Badge, Button, Logo, Nav, Notice, Sidebar, type NavItem } from "@forgeron/ui";
import { useEffect, useState } from "react";
import { ApprovalsPage } from "./approvals-page";
import { ApiError, type Api } from "./api";
import { AuditPage } from "./audit-page";
import { MembersPage } from "./members";
import { Overview } from "./overview";
import { loadPendingApprovals } from "./pending-approvals";
import { pathOf, routeClick, useRoute, type Route } from "./router";
import { SettingsPage } from "./settings";
import { Loading } from "./states";
import { ToolPage, ToolsPage } from "./tools-page";
import { useLoad } from "./use-load";
import { loadWorkspace, type WorkspaceInfo } from "./workspace";

// The console: a sidebar and the screen of the current path. Atelier (light) follows the system's
// colour scheme; Forge (dark) is the default (docs/design-system.md).

/** Puts `data-theme` on the page from `prefers-color-scheme`, and keeps it there. */
function useTheme() {
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!query) return;
    const apply = () => {
      if (query.matches) document.documentElement.dataset.theme = "light";
      else delete document.documentElement.dataset.theme;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
}

export interface AppProps {
  api: Api;
  /** The clock, for expiries and ages; tests and the harness fix it. */
  now?: () => Date;
}

export function App({ api, now = () => new Date() }: AppProps) {
  useTheme();
  const workspace = useLoad(() => loadWorkspace(api.fetchJson), [api]);
  const [route, go] = useRoute();

  if (workspace.loading) {
    return (
      <div className="fc-center">
        <Loading label="Loading the console" />
      </div>
    );
  }
  if (!workspace.data) {
    const signedOut = workspace.error instanceof ApiError && workspace.error.status === 401;
    return (
      <div className="fc-center">
        <Logo />
        {signedOut ? (
          <>
            <h1>Sign in to continue</h1>
            <p>Your session ended, or you have not signed in yet.</p>
            <Button variant="primary" href="/auth/login">
              Sign in
            </Button>
          </>
        ) : (
          <>
            <h1>The console could not load</h1>
            <Notice tone="danger">
              The workspace did not answer. Check your connection, then try again.
            </Notice>
            <Button onClick={workspace.reload}>Try again</Button>
          </>
        )}
      </div>
    );
  }
  return <Shell ws={workspace.data} api={api} now={now} route={route} go={go} />;
}

function Shell({
  ws,
  api,
  now,
  route,
  go,
}: {
  ws: WorkspaceInfo;
  api: Api;
  now: () => Date;
  route: Route;
  go: (href: string) => void;
}) {
  // The phone menu is open for the screen it was opened on: moving to another one closes it.
  const screen = `${route.id}/${route.tool ?? ""}`;
  const [openOn, setOpenOn] = useState<string>();
  const menuOpen = openOn === screen;
  // Escape closes it too.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(undefined);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const admin = ws.person.admin;
  const pending = useLoad(
    () => (admin ? loadPendingApprovals(api.fetchJson) : Promise.resolve([])),
    [api, admin],
  );
  const waiting = pending.data?.length ?? 0;
  const here = route.id === "tool" ? "tools" : route.id;
  const items: NavItem[] = [
    { id: "overview", label: "Overview", href: pathOf("overview") },
    { id: "tools", label: "Tools", href: pathOf("tools") },
    ...(admin
      ? [
          { id: "members", label: "Members", href: pathOf("members") },
          {
            id: "approvals",
            label: "Approvals",
            href: pathOf("approvals"),
            ...(waiting > 0 ? { badge: waiting } : {}),
          },
          { id: "audit", label: "Audit log", href: pathOf("audit") },
          { id: "settings", label: "Settings", href: pathOf("settings") },
        ]
      : []),
  ].map((item) => ({ ...item, current: item.id === here }));

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
      <Nav label="Console" items={items} onNavigate={(href) => go(href)} />
    </Sidebar>
  );

  return (
    <AppShell
      sidebar={sidebar}
      topbar={<Logo size={18} />}
      menuOpen={menuOpen}
      onMenuToggle={() => setOpenOn(menuOpen ? undefined : screen)}
    >
      <Screen ws={ws} api={api} now={now} route={route} go={go} onDecided={pending.reload} />
    </AppShell>
  );
}

function Screen({
  ws,
  api,
  now,
  route,
  go,
  onDecided,
}: {
  ws: WorkspaceInfo;
  api: Api;
  now: () => Date;
  route: Route;
  go: (href: string) => void;
  onDecided: () => void;
}) {
  switch (route.id) {
    case "overview":
      return <Overview ws={ws} fetchJson={api.fetchJson} go={go} />;
    case "tools":
      return <ToolsPage api={api} go={go} />;
    case "tool":
      return (
        <ToolPage
          name={route.tool!}
          api={api}
          admin={ws.person.admin}
          developer={ws.person.roles.includes("developer")}
        />
      );
    case "members":
      return ws.person.admin ? (
        <MembersPage api={api} selfId={ws.person.id} now={now} />
      ) : (
        <NotAdmin go={go} />
      );
    case "approvals":
      return ws.person.admin ? (
        <ApprovalsPage api={api} onDecided={onDecided} />
      ) : (
        <NotAdmin go={go} />
      );
    case "audit":
      return <AuditPage api={api} admin={ws.person.admin} now={now} />;
    case "settings":
      return <SettingsPage api={api} ws={ws} />;
    case "not-found":
      return (
        <main className="fg-page">
          <Notice
            tone="warning"
            title="This page does not exist."
            action={
              <Button size="sm" href={pathOf("overview")} onClick={routeClick(go)}>
                Open the overview
              </Button>
            }
          >
            The address may be mistyped, or the page may have moved.
          </Notice>
        </main>
      );
  }
}

function NotAdmin({ go }: { go: (href: string) => void }) {
  return (
    <main className="fg-page">
      <Notice
        tone="info"
        title="This page is for admins."
        action={
          <Button size="sm" href={pathOf("overview")} onClick={routeClick(go)}>
            Open the overview
          </Button>
        }
      >
        Ask an admin of this workspace to give you the admin role.
      </Notice>
    </main>
  );
}
