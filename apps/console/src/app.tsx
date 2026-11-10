import { Button, Logo, Notice } from "@forgeron/ui";
import { createElement, lazy, Suspense, useEffect, type ComponentType } from "react";
import { ApiError, type Api } from "./api";
import { loadPendingApprovals } from "./pending-approvals";
import { routeClick, useRoute } from "./router";
import { canSee } from "./shell/access";
import { AppLayout } from "./shell/app-layout";
import { SettingsLayout } from "./shell/settings-layout";
import { useTheme } from "./shell/theme";
import { matchRoute, routes, type LazyPage, type PageProps } from "./shell/routes";
import { Loading } from "./states";
import { useLoad } from "./use-load";
import { loadWorkspace, type WorkspaceInfo } from "./workspace";

// The console: the layout and the screen the route table gives for the current path. Atelier (light) follows the system's
// colour scheme; Forge (dark) is the default (docs/design-system.md).

export interface AppProps {
  api: Api;
  /** The clock, for expiries and ages; tests and the harness fix it. */
  now?: () => Date;
}

export function App({ api, now = () => new Date() }: AppProps) {
  useTheme();
  const workspace = useLoad(() => loadWorkspace(api.fetchJson), [api]);
  const [pathname, go, search] = useRoute();

  if (workspace.loading) {
    return (
      <div className="fc-center">
        <Loading shape="page" label="Loading the console" />
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
  return (
    <Shell ws={workspace.data} api={api} now={now} pathname={pathname} search={search} go={go} />
  );
}

// A lazy component per route, made once at load: `lazy` must not be called while rendering.
const screens = new Map<LazyPage, ComponentType<PageProps>>(
  routes.map((route) => [route.page, lazy(route.page)]),
);

function Shell({
  ws,
  api,
  now,
  pathname,
  search,
  go,
}: {
  ws: WorkspaceInfo;
  api: Api;
  now: () => Date;
  pathname: string;
  search: string;
  go: (href: string) => void;
}) {
  const match = matchRoute(pathname);
  const Layout = pathname.startsWith("/settings") ? SettingsLayout : AppLayout;
  const admin = ws.person.admin;
  const pending = useLoad(
    () => (admin ? loadPendingApprovals(api.fetchJson) : Promise.resolve([])),
    [api, admin],
  );
  const waiting = pending.data?.length ?? 0;

  // The tab title follows the screen.
  useEffect(() => {
    document.title = match
      ? `${match.route.title} · ${ws.workspace}`
      : `Not found · ${ws.workspace}`;
  }, [match, ws.workspace]);

  return (
    <Layout ws={ws} pathname={pathname} go={go} badges={{ "/approvals": waiting }}>
      {!match ? (
        <NotFound go={go} />
      ) : !canSee(match.route.access, ws.person) ? (
        <NotAdmin go={go} />
      ) : (
        <Suspense fallback={<Loading shape="page" label={`Loading ${match.route.title}`} />}>
          <RouteScreen
            key={pathname + search}
            load={match.route.page}
            props={{ ws, api, now, go, params: match.params, refreshPending: pending.reload }}
          />
        </Suspense>
      )}
    </Layout>
  );
}

function RouteScreen({ load, props }: { load: LazyPage; props: PageProps }) {
  return createElement(screens.get(load)!, props);
}

function NotFound({ go }: { go: (href: string) => void }) {
  return (
    <main className="fg-page">
      <Notice
        tone="warning"
        title="This page does not exist."
        action={
          <Button size="sm" href="/" onClick={routeClick(go)}>
            Open the home page
          </Button>
        }
      >
        The address may be mistyped, or the page may have moved.
      </Notice>
    </main>
  );
}

function NotAdmin({ go }: { go: (href: string) => void }) {
  return (
    <main className="fg-page">
      <Notice
        tone="info"
        title="This page is for admins."
        action={
          <Button size="sm" href="/" onClick={routeClick(go)}>
            Open the home page
          </Button>
        }
      >
        Ask an admin of this workspace to give you the admin role.
      </Notice>
    </main>
  );
}
