import { useCallback, useSyncExternalStore, type MouseEvent } from "react";

// Routing by path with the History API. The gateway answers every path that is not a file with the
// console (`not_found_handling: single-page-application`), so a deep link or a reload lands here.
// Adding a screen: one line in `ROUTES`, one case where the shell draws it.

export type RouteId =
  | "overview"
  | "tools"
  | "tool"
  | "members"
  | "approvals"
  | "audit"
  | "settings"
  | "not-found";

export interface Route {
  id: RouteId;
  /** `/tools/<name>`: the tool. */
  tool?: string;
}

const ROUTES: ReadonlyArray<{ id: Exclude<RouteId, "tool" | "not-found">; path: string }> = [
  { id: "overview", path: "/" },
  { id: "tools", path: "/tools" },
  { id: "members", path: "/members" },
  { id: "approvals", path: "/approvals" },
  { id: "audit", path: "/audit" },
  { id: "settings", path: "/settings" },
];

export const pathOf = (id: Exclude<RouteId, "tool" | "not-found">) =>
  ROUTES.find((r) => r.id === id)!.path;
export const toolPath = (name: string) => `/tools/${encodeURIComponent(name)}`;

export function matchRoute(pathname: string): Route {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const found = ROUTES.find((r) => r.path === path);
  if (found) return { id: found.id };
  const tool = /^\/tools\/([^/]+)$/.exec(path);
  if (tool) return { id: "tool", tool: decodeURIComponent(tool[1]!) };
  return { id: "not-found" };
}

const CHANGE = "forgeron:navigate";

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  window.addEventListener(CHANGE, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(CHANGE, listener);
  };
};

/** The current route and a way to go elsewhere. Moving puts focus on the content, for a keyboard user. */
export function useRoute(): [Route, (href: string) => void] {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => "/",
  );
  const go = useCallback((href: string) => {
    if (href !== window.location.pathname) window.history.pushState(null, "", href);
    window.dispatchEvent(new Event(CHANGE));
    window.scrollTo?.(0, 0);
    document.getElementById("content")?.focus({ preventScroll: true });
  }, []);
  return [matchRoute(pathname), go];
}

/** `onClick` for a link: a plain click routes in the page, a modified one opens the link as the browser does. */
export const routeClick =
  (go: (href: string) => void) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    go(event.currentTarget.getAttribute("href") ?? "/");
  };
