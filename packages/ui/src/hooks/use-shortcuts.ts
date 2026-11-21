// Keyboard shortcuts of a view: one key, or a key with modifiers ("F", "shift+B", "mod+1"), that
// do nothing while the person is typing. `mod` is Command on a Mac and Control elsewhere.

import { useEffect, useRef } from "react";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

/** Whether a key event is the combination written, e.g. `"mod+shift+K"`; case does not matter. */
export function matchShortcut(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
  combo: string,
): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts.pop();
  if (!key) return false;
  const want = new Set(parts);
  const mod = want.has("mod");
  const meta = want.has("meta") || (mod && isMac());
  const ctrl = want.has("ctrl") || (mod && !isMac());
  return (
    event.key.toLowerCase() === key &&
    event.metaKey === meta &&
    event.ctrlKey === ctrl &&
    event.altKey === want.has("alt") &&
    event.shiftKey === want.has("shift")
  );
}

const KEY_NAMES: Readonly<Record<string, string>> = {
  mod: "⌘",
  meta: "⌘",
  ctrl: "Ctrl",
  shift: "⇧",
  alt: "⌥",
  enter: "↵",
  escape: "Esc",
  backspace: "⌫",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

/**
 * The caps to show for a combination, for `Kbd`: `"mod+shift+k"` gives `["⌘", "⇧", "K"]`. `mod`
 * reads ⌘; pass `{ mac: false }` to read Ctrl where the page knows it is not on a Mac.
 */
export function formatShortcut(combo: string, { mac = true }: { mac?: boolean } = {}): string[] {
  return combo.split("+").map((part) => {
    const k = part.toLowerCase();
    if (k === "mod") return mac ? "⌘" : "Ctrl";
    return KEY_NAMES[k] ?? (part.length === 1 ? part.toUpperCase() : part);
  });
}

/** True when keys belong to a field: an input, a text area, a select, editable text. */
function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

/**
 * Binds shortcuts on the page while the component is shown: `{ f: openFilter, "mod+1": toList }`.
 * Ignored while typing in a field, and while a menu or dialog holds the focus (`[role=dialog]`,
 * `[role=menu]`, `[role=listbox]`), so a key typed there stays there.
 */
export function useShortcuts(
  bindings: Readonly<Record<string, (event: KeyboardEvent) => void>>,
  { enabled = true }: { enabled?: boolean } = {},
): void {
  const current = useRef(bindings);
  useEffect(() => {
    current.current = bindings;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || typing(event.target)) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[role=dialog], [role=menu], [role=listbox]")
      )
        return;
      for (const [combo, run] of Object.entries(current.current)) {
        if (matchShortcut(event, combo)) {
          event.preventDefault();
          run(event);
          return;
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
