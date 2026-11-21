// A button that opens a menu of links, actions and one-of-many choices. A preset over the
// DropdownMenu parts (dropdown-menu.tsx), so focus, arrows, typeahead, Escape and dismissal are
// Base UI's Menu. Without `entries`, `Menu` is the root of those parts (shadcn's composition, D-156).

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type MenuEntry =
  | { kind: "link"; label: ReactNode; href: string; onSelect?: (href: string) => void }
  | { kind: "action"; label: ReactNode; onSelect: () => void; tone?: "danger" }
  | { kind: "radio"; label: ReactNode; checked: boolean; onSelect: () => void }
  | { kind: "heading"; label: ReactNode }
  /** Plain muted text, not selectable: an email address, say. */
  | { kind: "text"; label: ReactNode }
  | { kind: "separator" };

export interface MenuProps extends Omit<
  ComponentProps<"div">,
  "children" | "className" | "onSelect" | "title"
> {
  /** What the button shows: a name, an avatar, a chevron. */
  trigger: ReactNode;
  /** Accessible name of the button and of the menu. */
  label: string;
  entries: ReadonlyArray<MenuEntry>;
  /** Where the menu opens: `above` for a button at the bottom of the screen. */
  placement?: "below" | "above";
  /** Which edge of the button the menu lines up with. */
  align?: "start" | "center" | "end";
  className?: string;
}

/** `entries` stays undefined: with entries, `Menu` is the props-driven one. */
export type MenuRootProps = ComponentProps<typeof DropdownMenu> & { entries?: undefined };

/**
 * With `entries`: a button that opens a menu of links, actions and one-of-many choices. Focus goes
 * to the first item (the checked one for a choice); Up, Down, Home and End move; Escape closes and
 * returns focus to the button; Tab and a click outside close it. Without `entries`: the root of the
 * DropdownMenu parts (`DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`…).
 */
export function Menu(props: MenuProps | MenuRootProps) {
  if (props.entries !== undefined) return <MenuPreset {...(props as MenuProps)} />;
  const { entries: _entries, ...root } = props as MenuRootProps;
  return <DropdownMenu {...root} />;
}

const plainClick = (e: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** Consecutive choices share one radio group; everything else stands alone. */
function drawEntries(entries: ReadonlyArray<MenuEntry>): ReactNode[] {
  const nodes: ReactNode[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    switch (entry.kind) {
      case "separator":
        nodes.push(<DropdownMenuSeparator key={i} className="fg-menu-sep" />);
        break;
      case "heading":
        nodes.push(
          <DropdownMenuLabel key={i} role="presentation" className="fg-menu-heading">
            {entry.label}
          </DropdownMenuLabel>,
        );
        break;
      case "text":
        nodes.push(
          <div key={i} role="presentation" className="fg-menu-text">
            {entry.label}
          </div>,
        );
        break;
      case "link":
        nodes.push(
          <DropdownMenuItem
            key={i}
            className="fg-menu-item"
            render={<a href={entry.href} />}
            onClick={(e) => {
              if (entry.onSelect && plainClick(e)) {
                e.preventDefault();
                entry.onSelect(entry.href);
              }
            }}
          >
            {entry.label}
          </DropdownMenuItem>,
        );
        break;
      case "action":
        nodes.push(
          <DropdownMenuItem
            key={i}
            className="fg-menu-item"
            variant={entry.tone === "danger" ? "destructive" : "default"}
            onClick={() => entry.onSelect()}
          >
            {entry.label}
          </DropdownMenuItem>,
        );
        break;
      case "radio": {
        const start = i;
        const run: Array<Extract<MenuEntry, { kind: "radio" }>> = [];
        while (i < entries.length && entries[i]!.kind === "radio") {
          run.push(entries[i] as Extract<MenuEntry, { kind: "radio" }>);
          i++;
        }
        i--;
        const checked = run.findIndex((r) => r.checked);
        nodes.push(
          <DropdownMenuRadioGroup key={start} value={checked < 0 ? "" : String(checked)}>
            {run.map((r, j) => (
              <DropdownMenuRadioItem
                key={j}
                value={String(j)}
                className="fg-menu-item"
                closeOnClick
                onClick={() => r.onSelect()}
              >
                {r.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>,
        );
        break;
      }
    }
  }
  return nodes;
}

function MenuPreset({
  trigger,
  label,
  entries,
  placement = "below",
  align = "start",
  className,
  ...rest
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  // A choice menu opens on the current choice, not on the first row.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      list.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div data-slot="menu" {...rest} className={cx("fg-menu", className)}>
      <DropdownMenu open={open} onOpenChange={(next) => setOpen(next)}>
        <DropdownMenuTrigger className="fg-menu-trigger" aria-label={label}>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          ref={list}
          side={placement === "above" ? "top" : "bottom"}
          align={align}
          className="fg-menu-list"
          aria-label={label}
        >
          {drawEntries(entries)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
