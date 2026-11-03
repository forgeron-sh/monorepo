import { useCallback, useSyncExternalStore, type MouseEvent } from "react";
import { hrefOf } from "./shell/href";

// Routing by path with the History API. The gateway answers every path that is not a file with the
// console (`not_found_handling: single-page-application`), so a deep link or a reload lands here.
// The screens are the route table (`shell/routes.ts`).

/** The address of a screen of the shell, by name; a feature builds its own with `hrefOf`. */
const PATHS = {
  overview: "/",
  tools: "/tools",
  members: "/members",
  approvals: "/approvals",
  audit: "/audit",
  settings: "/settings",
} as const;

export const pathOf = (id: keyof typeof PATHS) => PATHS[id];
export const toolPath = (name: string) => hrefOf("/tools/:name", { name });

const CHANGE = "forgeron:navigate";

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  window.addEventListener(CHANGE, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(CHANGE, listener);
  };
};

/** The current address and a way to go elsewhere. Moving puts focus on the content, for a keyboard user. */
export function useRoute(): [string, (href: string) => void] {
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
  return [pathname, go];
}

/** `onClick` for a link: a plain click routes in the page, a modified one opens the link as the browser does. */
export const routeClick =
  (go: (href: string) => void) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    go(event.currentTarget.getAttribute("href") ?? "/");
  };
