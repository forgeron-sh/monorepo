import { useEffect } from "react";

// Keyboard: `g` then a letter goes to a section, `/` opens the search. Not while typing in a field or
// while a dialog is open.

export interface Shortcut {
  /** The letter after `g`. */
  key: string;
  href: string;
}

const typing = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el?.tagName) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
};

const WINDOW_MS = 1500;

export function useShortcuts(
  shortcuts: ReadonlyArray<Shortcut>,
  go: (href: string) => void,
  onSearch: () => void,
) {
  useEffect(() => {
    let armedAt = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (document.querySelector('[role="dialog"], [role="menu"]')) return;
      if (e.key === "/") {
        e.preventDefault();
        armedAt = 0;
        onSearch();
        return;
      }
      if (e.key === "g" && !e.repeat) {
        armedAt = Date.now();
        return;
      }
      if (armedAt && Date.now() - armedAt < WINDOW_MS) {
        const hit = shortcuts.find((s) => s.key === e.key);
        armedAt = 0;
        if (hit) {
          e.preventDefault();
          go(hit.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, go, onSearch]);
}
