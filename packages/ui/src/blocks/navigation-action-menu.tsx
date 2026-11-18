// The actions of a record behind its "…" button or a right click: rows with an icon, a label and a
// shortcut, separators, a danger row last, and submenus (Status ▸, Priority ▸, Assignee ▸) that
// show the pickers' marks. Focus, typeahead, arrows and dismissal come from Base UI's Menu; the
// right-click variant shares every part with it through Base UI's ContextMenu.

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import type { IconDefinition } from "@forgeron/icons";
import { ArrowRight01Icon, Tick02Icon } from "@forgeron/icons";
import type { ReactElement, ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Kbd } from "../marks";

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

function Entries({
  items,
  onSelect,
}: {
  items: ReadonlyArray<ActionMenuEntry>;
  onSelect: (id: string) => void;
}) {
  return items.map((entry, i) => {
    if (isSeparator(entry)) return <Menu.Separator key={`sep-${i}`} className="fg-amenu-sep" />;
    if (isHeading(entry))
      return (
        <div key={`h-${i}`} className="fg-amenu-heading" role="presentation">
          {entry.heading}
        </div>
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
    const rowClass = cx("fg-pop-row fg-amenu-row", entry.danger && "fg-amenu-danger");
    if (entry.items) {
      return (
        <Menu.SubmenuRoot key={entry.id}>
          <Menu.SubmenuTrigger className={rowClass} {...(entry.disabled ? { disabled: true } : {})}>
            {content}
            <span className="fg-amenu-chev">
              <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
            </span>
          </Menu.SubmenuTrigger>
          <Menu.Portal>
            <Menu.Positioner className="fg-pop-positioner" sideOffset={2} alignOffset={-5}>
              <Menu.Popup className="fg-pop fg-amenu" aria-label={entry.label}>
                <Entries items={entry.items} onSelect={onSelect} />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.SubmenuRoot>
      );
    }
    return (
      <Menu.Item
        key={entry.id}
        className={rowClass}
        label={entry.label}
        onClick={() => onSelect(entry.id)}
        {...(entry.disabled ? { disabled: true } : {})}
      >
        {content}
      </Menu.Item>
    );
  });
}

interface MenuBase {
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
    <Menu.Root
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange: (next: boolean) => onOpenChange(next) } : {})}
    >
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner className="fg-pop-positioner" sideOffset={4} side={side} align={align}>
          <Menu.Popup className={cx("fg-pop fg-amenu", className)} aria-label={label}>
            <Entries items={items} onSelect={onSelect} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export interface ContextMenuProps extends MenuBase {
  /** The area that opens the menu on right click or long press: a row, a card. */
  children: ReactNode;
  /** Classes of the area. */
  areaClassName?: string;
}

/** The same menu on a right click (or a long press) anywhere in an area: a row of a list. */
export function ContextMenu({
  items,
  onSelect,
  label,
  children,
  areaClassName,
  className,
}: ContextMenuProps) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger className={areaClassName}>{children}</BaseContextMenu.Trigger>
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className="fg-pop-positioner">
          <BaseContextMenu.Popup className={cx("fg-pop fg-amenu", className)} aria-label={label}>
            <Entries items={items} onSelect={onSelect} />
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}
