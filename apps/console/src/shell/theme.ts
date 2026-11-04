import { useEffect, useSyncExternalStore } from "react";

// The theme: Forge (dark, the default), Atelier (light), or whatever the system prefers. The choice is
// the person's, kept in this browser; `data-theme` on the page is what the tokens read.

export type ThemePreference = "system" | "forge" | "atelier";
export const THEMES: ReadonlyArray<{ id: ThemePreference; label: string }> = [
  { id: "system", label: "System" },
  { id: "forge", label: "Forge (dark)" },
  { id: "atelier", label: "Atelier (light)" },
];

const KEY = "forgeron-theme";
const listeners = new Set<() => void>();

function stored(): ThemePreference {
  try {
    const value = window.localStorage.getItem(KEY);
    if (value === "forge" || value === "atelier") return value;
  } catch {
    // Storage can be blocked: the system preference applies.
  }
  return "system";
}

let current: ThemePreference | undefined;
const read = () => (current ??= stored());

export function setThemePreference(next: ThemePreference) {
  current = next;
  try {
    if (next === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, next);
  } catch {
    // Not kept after a reload; still applied now.
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The person's choice and a way to change it. */
export function useThemePreference(): [ThemePreference, (next: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, read, () => "system" as const);
  return [preference, setThemePreference];
}

/** Puts `data-theme` on the page from the choice, and follows the system while it is "system". */
export function useTheme() {
  const [preference] = useThemePreference();
  useEffect(() => {
    const root = document.documentElement;
    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    const apply = () => {
      const light = preference === "atelier" || (preference === "system" && query?.matches);
      if (light) root.dataset.theme = "light";
      else delete root.dataset.theme;
    };
    apply();
    if (preference !== "system" || !query) return;
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [preference]);
}
