// The actions of a record behind its "…" button: rows with an icon, a label and a shortcut,
// separators, a danger row last, and submenus (Status ▸, Priority ▸, Assignee ▸) that show the
// pickers' marks. Built from the DropdownMenu parts (dropdown-menu.tsx), so focus, typeahead,
// arrows and dismissal are Base UI's Menu. `ContextMenu` (context-menu.tsx) draws the same rows
// on a right click through `MenuEntries`.

import type { IconDefinition } from "@forgeron/icons";
import { Tick02Icon } from "@forgeron/icons";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { cx } from "./cx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Icon } from "./icon";
import { Kbd } from "./marks";

export interface ActionMenuItem {
  /** Passed to `onSelect`; unique across the menu and its submenus, e.g. `status:done`. */
  id: string;
  label: string;
  /** A pixel icon before the label. */
  icon?: IconDefinition;
  /** Any mark in place of `icon`: a status glyph, a priority, an avatar. */
  glyph?: ReactNode;
  /** The shortcut that does the same, shown at the end: `"S"`, `["⇧", "P"]`. */
  kbd?: string | ReadonlyArray<string>;
  /** Destructive: written in the danger colour. Put it last, after a separator. */
  danger?: boolean;
  disabled?: boolean;
  /** Marks the current value with a tick, in a submenu of choices. */
  checked?: boolean;
  /** Turns the row into a submenu that opens to the side. */
  items?: ReadonlyArray<ActionMenuEntry>;
}

/** A line between two groups of rows. */
export interface ActionMenuSeparator {
  separator: true;
}

/** A small mono heading above the rows that follow. */
export interface ActionMenuHeading {
  heading: string;
}

export type ActionMenuEntry = ActionMenuItem | ActionMenuSeparator | ActionMenuHeading;

const isSeparator = (e: ActionMenuEntry): e is ActionMenuSeparator => "separator" in e;
const isHeading = (e: ActionMenuEntry): e is ActionMenuHeading => "heading" in e;

const markOf = (item: ActionMenuItem) =>
  item.glyph ?? (item.icon ? <Icon icon={item.icon} size={12} variant="mono" /> : null);

interface RowProps {
  className?: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

/** The parts `MenuEntries` draws with: the DropdownMenu's, or the ContextMenu's. */
export interface MenuKit {
  Item: ComponentType<RowProps>;
  Separator: ComponentType<{ className?: string }>;
  Label: ComponentType<{ className?: string; role?: string; children?: ReactNode }>;
  Sub: ComponentType<{ children?: ReactNode }>;
  SubTrigger: ComponentType<Omit<RowProps, "onClick">>;
  SubContent: ComponentType<{
    className?: string;
    "aria-label"?: string;
    children?: ReactNode;
  }>;
}

const DROPDOWN_KIT: MenuKit = {
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Label: DropdownMenuLabel,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};

/** The rows, separators, headings and submenus of an `items` list, drawn with the parts of `kit`. */
export function MenuEntries({
  items,
  onSelect,
  kit = DROPDOWN_KIT,
}: {
  items: ReadonlyArray<ActionMenuEntry>;
  onSelect: (id: string) => void;
  kit?: MenuKit;
}) {
  const { Item, Separator, Label, Sub, SubTrigger, SubContent } = kit;
  return items.map((entry, i) => {
    if (isSeparator(entry)) return <Separator key={`sep-${i}`} className="fg-amenu-sep" />;
    if (isHeading(entry))
      return (
        <Label key={`h-${i}`} className="fg-amenu-heading" role="presentation">
          {entry.heading}
        </Label>
      );
    const content = (
      <>
        <span className="fg-amenu-mark">{markOf(entry)}</span>
        <span className="fg-pop-label">{entry.label}</span>
        {entry.checked ? (
          <span className="fg-pop-tick">
            <Icon icon={Tick02Icon} size={12} variant="mono" />
          </span>
        ) : null}
        {entry.kbd ? <Kbd keys={entry.kbd} className="fg-amenu-kbd" /> : null}
      </>
    );
    const rowClass = cx("fg-amenu-row", entry.danger && "fg-amenu-danger");
    if (entry.items) {
      return (
        <Sub key={entry.id}>
          <SubTrigger className={rowClass} {...(entry.disabled ? { disabled: true } : {})}>
            <span className="fg-amenu-sub">{content}</span>
          </SubTrigger>
          <SubContent className="fg-amenu" aria-label={entry.label}>
            <MenuEntries items={entry.items} onSelect={onSelect} kit={kit} />
          </SubContent>
        </Sub>
      );
    }
    return (
      <Item
        key={entry.id}
        className={rowClass}
        label={entry.label}
        onClick={() => onSelect(entry.id)}
        {...(entry.disabled ? { disabled: true } : {})}
      >
        {content}
      </Item>
    );
  });
}

export interface MenuBase {
  /** The rows, separators, headings and submenus, in order. */
  items: ReadonlyArray<ActionMenuEntry>;
  /** Called with the `id` of the row chosen, in the menu or a submenu; the menu then closes. */
  onSelect: (id: string) => void;
  /** Names the menu for assistive technology, e.g. "Actions on OPS-40". */
  label?: string;
  className?: string;
}

export interface ActionMenuProps extends MenuBase {
  /** The control that opens the menu: one element that takes a ref, an IconButton or a Button. */
  trigger: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where the menu opens against its trigger. */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

/** The actions on a record, behind a "…" button: icons, shortcuts, submenus, a danger row. */
export function ActionMenu({
  items,
  onSelect,
  label,
  trigger,
  open,
  onOpenChange,
  side = "bottom",
  align = "start",
  className,
}: ActionMenuProps) {
  return (
    <DropdownMenu
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange: (next: boolean) => onOpenChange(next) } : {})}
    >
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        side={side}
        align={align}
        className={cx("fg-amenu", className)}
        aria-label={label}
      >
        <MenuEntries items={items} onSelect={onSelect} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
