import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";

export type MenuEntry =
  | { kind: "link"; label: ReactNode; href: string; onSelect?: (href: string) => void }
  | { kind: "action"; label: ReactNode; onSelect: () => void; tone?: "danger" }
  | { kind: "radio"; label: ReactNode; checked: boolean; onSelect: () => void }
  | { kind: "heading"; label: ReactNode }
  /** Plain muted text, not selectable: an email address, say. */
  | { kind: "text"; label: ReactNode }
  | { kind: "separator" };

export interface MenuProps {
  /** What the button shows: a name, an avatar, a chevron. */
  trigger: ReactNode;
  /** Accessible name of the button and of the menu. */
  label: string;
  entries: ReadonlyArray<MenuEntry>;
  /** Where the menu opens: `above` for a button at the bottom of the screen. */
  placement?: "below" | "above";
  className?: string;
}

const ITEMS = '[role="menuitem"], [role="menuitemradio"]';

/**
 * A button that opens a menu of links, actions and one-of-many choices. Focus goes to the first
 * item (the checked one for a choice); Up, Down, Home and End move; Escape closes and returns focus
 * to the button; Tab and a click outside close it.
 */
export function Menu({ trigger, label, entries, placement = "below", className }: MenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const items = [...(list.current?.querySelectorAll<HTMLElement>(ITEMS) ?? [])];
    (items.find((i) => i.getAttribute("aria-checked") === "true") ?? items[0])?.focus();
    const outside = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const items = [...(list.current?.querySelectorAll<HTMLElement>(ITEMS) ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (at + 1) % items.length
        : event.key === "ArrowUp"
          ? (at - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    items[next]?.focus();
  };

  return (
    <div ref={root} className={cx("fg-menu", className)}>
      <button
        ref={button}
        type="button"
        className="fg-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={list}
          id={`${id}-menu`}
          role="menu"
          aria-label={label}
          className={cx("fg-menu-list", placement === "above" && "fg-menu-above")}
          onKeyDown={onKeyDown}
        >
          {entries.map((entry, i) => {
            switch (entry.kind) {
              case "separator":
                return <div key={i} role="separator" className="fg-menu-sep" />;
              case "heading":
                return (
                  <div key={i} role="presentation" className="fg-menu-heading">
                    {entry.label}
                  </div>
                );
              case "text":
                return (
                  <div key={i} role="presentation" className="fg-menu-text">
                    {entry.label}
                  </div>
                );
              case "link":
                return (
                  <a
                    key={i}
                    role="menuitem"
                    href={entry.href}
                    tabIndex={-1}
                    className="fg-menu-item"
                    onClick={(e) => {
                      close(false);
                      if (
                        entry.onSelect &&
                        e.button === 0 &&
                        !e.metaKey &&
                        !e.ctrlKey &&
                        !e.shiftKey &&
                        !e.altKey
                      ) {
                        e.preventDefault();
                        entry.onSelect(entry.href);
                      }
                    }}
                  >
                    {entry.label}
                  </a>
                );
              case "radio":
                return (
                  <button
                    key={i}
                    type="button"
                    role="menuitemradio"
                    aria-checked={entry.checked}
                    tabIndex={-1}
                    className="fg-menu-item"
                    onClick={() => {
                      entry.onSelect();
                      close(true);
                    }}
                  >
                    <span>{entry.label}</span>
                    {entry.checked ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              case "action":
                return (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    className={cx("fg-menu-item", entry.tone === "danger" && "fg-menu-danger")}
                    onClick={() => {
                      close(false);
                      entry.onSelect();
                    }}
                  >
                    {entry.label}
                  </button>
                );
            }
          })}
        </div>
      ) : null}
    </div>
  );
}
