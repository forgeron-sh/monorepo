import { createElement, type ComponentType } from "react";
import type { Access } from "./access";
import type { PageProps } from "./page-props";

export type { PageProps };

// The route table: every screen of the console is one entry here. A feature adds its own entries in
// `features/<domain>/routes.ts` (collected below), so no one edits the shell to add a page.

/** A page is loaded when it is first opened: `() => import("./pages/list")` with a default export. */
export type LazyPage = () => Promise<{ default: ComponentType<PageProps> }>;

/**
 * The groups of the sidebar, in order (D-128): `main` is the person's own space (Home, My tools,
 * Discover), `admin` the Administration section. Settings has its own area (`settings`).
 */
export type NavGroup = "main" | "admin";
const GROUPS: NavGroup[] = ["main", "admin"];

export interface RouteDef {
  /** `/admin/tools/:name`: a path; `:name` segments are read into `params`. Two routes never match the same address. */
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
    /** The letter after `g`: `g` then `m` goes to My tools. One letter, lowercase, unique. */
    shortcut?: string;
    /** Its place in the group: low first (default 100, then the order of the table). */
    order?: number;
  };
  /** Present: the route is a page of the settings area (the area is built by the shell). */
  settings?: { group: "account" | "workspace" | "operations"; label: string };
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
    nav: { group: "main", label: "Home", shortcut: "h", order: 0 },
    page: adapt(
      () => import("../features/portal/home").then((m) => m.PortalHome),
      ({ ws, api, go }) => ({ ws, api, go }),
    ),
  },
];

// Every `features/<domain>/routes.ts` default-exports `RouteDef[]` (and may register tool tabs).
const featureModules = import.meta.glob<{ default: RouteDef[] }>("../features/*/routes.ts", {
  eager: true,
});

/** Sidebar groups first, in order, then the routes without an item: a feature's item joins its group. */
const rank = (route: RouteDef) =>
  route.nav
    ? GROUPS.indexOf(route.nav.group) * 1000 + (route.nav.order ?? 100)
    : GROUPS.length * 1000;

export const routes: ReadonlyArray<RouteDef> = [
  ...own,
  ...Object.values(featureModules).flatMap((m) => m.default),
].sort((a, b) => rank(a) - rank(b));

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
