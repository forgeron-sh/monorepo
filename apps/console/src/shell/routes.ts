import { createElement, type ComponentType } from "react";
import type { Access } from "./access";
import type { PageProps } from "./page-props";

export type { PageProps };

// The route table: every screen of the console is one entry here. A feature adds its own entries in
// `features/<domain>/routes.ts` (collected below), so no one edits the shell to add a page.

/** A page is loaded when it is first opened: `() => import("./pages/list")` with a default export. */
export type LazyPage = () => Promise<{ default: ComponentType<PageProps> }>;

/** The groups of the sidebar, in order. Settings has its own area (`settings`). */
type NavGroup = "main" | "admin";

export interface RouteDef {
  /** `/tools/:name`: a path; `:name` segments are read into `params`. Two routes never match the same address. */
  path: string;
  /** The tab title and the heading of the screen. */
  title: string;
  /** Who may see it; for anyone else the shell says the page is for admins. */
  access: Access;
  page: LazyPage;
  /** Present: the route has an item in the sidebar. A route with parameters has none. */
  nav?: {
    group: NavGroup;
    label: string;
    /** The letter after `g`: `g` then `m` goes to Members. One letter, lowercase, unique. */
    shortcut?: string;
  };
  /** Present: the route is a page of the settings area (the area is built by the shell). */
  settings?: { group: "account" | "workspace" | "administration"; label: string };
}

/** Adapts a page written with its own props to the shell's `PageProps`. */
const adapt =
  <P extends object>(load: () => Promise<ComponentType<P>>, props: (p: PageProps) => P): LazyPage =>
  async () => {
    const Page = await load();
    return { default: (p) => createElement(Page as ComponentType<object>, props(p)) };
  };

const own: RouteDef[] = [
  {
    path: "/",
    title: "Home",
    access: "everyone",
    nav: { group: "main", label: "Home", shortcut: "h" },
    page: adapt(
      () => import("../overview").then((m) => m.Overview),
      ({ ws, api, go }) => ({ ws, fetchJson: api.fetchJson, go }),
    ),
  },
  {
    path: "/tools",
    title: "Tools",
    access: "everyone",
    nav: { group: "main", label: "Tools", shortcut: "t" },
    page: adapt(
      () => import("../tools-page").then((m) => m.ToolsPage),
      ({ api, go }) => ({ api, go }),
    ),
  },
  {
    path: "/tools/:name",
    title: "Tool",
    access: "everyone",
    page: adapt(
      () => import("../tools-page").then((m) => m.ToolPage),
      ({ api, ws, params }) => ({ name: params.name!, api, admin: ws.person.admin }),
    ),
  },
  {
    path: "/members",
    title: "Members",
    access: "admin",
    nav: { group: "admin", label: "Members", shortcut: "m" },
    page: adapt(
      () => import("../members").then((m) => m.MembersPage),
      ({ api, ws, now }) => ({ api, selfId: ws.person.id, now }),
    ),
  },
  {
    path: "/approvals",
    title: "Approvals",
    access: "admin",
    nav: { group: "admin", label: "Approvals", shortcut: "a" },
    page: adapt(
      () => import("../approvals-page").then((m) => m.ApprovalsPage),
      ({ api, refreshPending }) => ({ api, onDecided: refreshPending }),
    ),
  },
  {
    path: "/audit",
    title: "Audit log",
    access: "admin",
    nav: { group: "admin", label: "Audit log", shortcut: "l" },
    page: adapt(
      () => import("../audit-page").then((m) => m.AuditPage),
      ({ api, ws, now }) => ({ api, admin: ws.person.admin, now }),
    ),
  },
  {
    path: "/settings",
    title: "Settings",
    access: "admin",
    page: adapt(
      () => import("../settings").then((m) => m.SettingsPage),
      ({ api, ws }) => ({ api, ws }),
    ),
  },
];

// Every `features/<domain>/routes.ts` default-exports `RouteDef[]` (and may register tool tabs).
const featureModules = import.meta.glob<{ default: RouteDef[] }>("../features/*/routes.ts", {
  eager: true,
});

export const routes: ReadonlyArray<RouteDef> = [
  ...own,
  ...Object.values(featureModules).flatMap((m) => m.default),
];

const segments = (path: string) => path.split("/").filter(Boolean);

export interface Match {
  route: RouteDef;
  params: Record<string, string>;
}

/** The route of an address, with its parameters decoded; `undefined` for an unknown address. */
export function matchRoute(
  pathname: string,
  table: ReadonlyArray<RouteDef> = routes,
): Match | undefined {
  const given = segments(pathname);
  for (const route of table) {
    const pattern = segments(route.path);
    if (pattern.length !== given.length) continue;
    const params: Record<string, string> = {};
    const ok = pattern.every((part, i) => {
      if (!part.startsWith(":")) return part === given[i];
      try {
        params[part.slice(1)] = decodeURIComponent(given[i]!);
        return true;
      } catch {
        return false;
      }
    });
    if (ok) return { route, params };
  }
  return undefined;
}
