// Editing in place, shared by the issue list, the issue board and the projects table: which field
// is open, the shortcuts that open one on the current row, the right-click and "⋯" menus of a row.
// The pickers themselves are the library's (pickers.tsx, overlays.tsx); a row only lends them its
// own marks as triggers.

import { MoreHorizontalIcon } from "@forgeron/icons";
import {
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { useShortcuts } from "../hooks/use-shortcuts";
import { IconButton } from "../identity";
import type { DatePreset } from "../overlays";
import type { StatusKind } from "../glyphs";
import type { LabelOption, Person } from "../pickers";
import { ActionMenu, MenuEntries, type ActionMenuEntry, type MenuKit } from "../action-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../context-menu";
import type { IssueItem } from "./lists-parts";

/* ---------------------------------------------------------------- the options of an editor */

/** A fully custom editor: drawn in place of the property, calls `change` with what it sets. */
export type IssueEditorRender = (
  issue: IssueItem,
  change: (patch: Partial<IssueItem>) => void,
) => ReactNode;

interface IssueEditorBase {
  /** Replaces the picker with your own control; the shortcut then does nothing. */
  render?: IssueEditorRender;
}

/** Who can be chosen for a person property. */
interface PersonChoice {
  /** The people offered; the block's `people` by default. */
  people?: ReadonlyArray<Person>;
  /** The person viewing: listed first, marked "(you)". */
  me?: string;
}

/**
 * How each property of an issue is edited. Absent: the default picker. `false`: read-only. An
 * object: the picker, restricted or renamed, or `render` for your own.
 */
export interface IssueEditors {
  status?:
    | false
    | (IssueEditorBase & {
        /** The states offered, in order; all six by default. */
        statuses?: ReadonlyArray<StatusKind>;
        /** Other names, e.g. `{ review: "Waiting on client" }`. */
        names?: Partial<Record<StatusKind, string>>;
      });
  priority?: false | IssueEditorBase;
  labels?:
    | false
    | (IssueEditorBase & {
        /** The labels offered; the block's `labels` by default. */
        labels?: ReadonlyArray<LabelOption>;
      });
  assignee?:
    | false
    | (IssueEditorBase &
        PersonChoice & {
          /** The entry for nobody; "No assignee" by default, `null` to require someone. */
          noneLabel?: string | null;
        });
  /** Read-only unless given: who wrote an issue rarely changes. */
  author?: false | (IssueEditorBase & PersonChoice);
  due?:
    | false
    | (IssueEditorBase & {
        /** The quick picks above the month; tomorrow, end of week… by default, `[]` for none. */
        presets?: ReadonlyArray<DatePreset>;
        /** Offers to remove the date; true by default. */
        clearable?: boolean;
      });
}

/** The properties of an issue that can be edited. */
export type IssueField = keyof IssueEditors;

/* ---------------------------------------------------------------- the open field */

interface OpenAt {
  id: string;
  field: string;
}

/**
 * Which picker is open, on which record: one at a time across a block. `props(id, field)` gives a
 * picker its `open` / `onOpenChange`; `show(id, field)` opens one from a shortcut or a menu.
 */
export function useOpenField(rowSelector: (id: string) => string) {
  const root = useRef<HTMLDivElement>(null);
  const [at, setAt] = useControllableState<OpenAt | null>({ defaultValue: null });
  // A picker opened on a hidden anchor (an empty property) cannot give the focus back to it: the
  // row takes it, so the arrows and the shortcuts keep working.
  const refocus = (id: string) =>
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body) return;
      root.current?.querySelector<HTMLElement>(rowSelector(id))?.focus();
    });
  const props = (id: string, field: string) => ({
    open: at?.id === id && at.field === field,
    onOpenChange: (open: boolean) => {
      if (open) {
        setAt({ id, field });
        return;
      }
      setAt((cur) => (cur?.id === id && cur.field === field ? null : cur));
      refocus(id);
    },
  });
  return { root, at, show: (id: string, field: string) => setAt({ id, field }), props };
}

/**
 * Whether the focus is inside the block: the field shortcuts listen only then, so two blocks on
 * one page never both answer a key.
 */
export function useFocusWithin() {
  const [inside, setInside] = useState(false);
  return {
    inside,
    props: {
      onFocus: () => setInside(true),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setInside(false);
      },
    },
  };
}

/**
 * A key per field (S, P, A, L, D on an issue) opens its picker on the current row while the block
 * has the focus. `keys` maps the key to the field; `editable` leaves out the read-only ones.
 */
export function useFieldShortcuts(
  enabled: boolean,
  open: (field: string) => void,
  editable: (field: string) => boolean,
  keys: Readonly<Record<string, string>>,
) {
  const bindings = Object.fromEntries(
    Object.entries(keys)
      .filter(([, field]) => editable(field))
      .map(([key, field]) => [key, () => open(field)]),
  );
  useShortcuts(bindings, { enabled });
}

/* ---------------------------------------------------------------- the parts */

/**
 * Wraps an editor inside a row: a click or a key on it, or in its list (a portal, which React
 * still bubbles through the row), stays with the editor and never opens the row.
 */
export function Stop({ children, className, ...rest }: ComponentProps<"span">) {
  return (
    <span
      data-slot="row-stop"
      {...rest}
      className={cx("fg-issue-stop", className)}
      onClick={(event) => {
        rest.onClick?.(event);
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (/^(Enter| |Arrow.*|Home|End)$/.test(event.key)) event.stopPropagation();
      }}
    >
      {children}
    </span>
  );
}

/** What a row needs to show its menu: the entries, and what to do with the one chosen. */
export interface RowMenuProps {
  items: ReadonlyArray<ActionMenuEntry> | undefined;
  onSelect: (actionId: string) => void;
  label: string;
}

const CONTEXT_KIT: MenuKit = {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Label: ContextMenuLabel,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

/**
 * The right-click menu of a row, when it has one. `asChild`: the one child element (a `<tr>`) is
 * the area itself, where it would else sit in a wrapper that a table cannot hold.
 */
export function RowMenuArea({
  items,
  onSelect,
  label,
  children,
  asChild,
}: RowMenuProps & { children: ReactNode; asChild?: boolean }) {
  if (!items || items.length === 0) return children;
  if (asChild) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="fg-amenu" aria-label={label}>
          <MenuEntries items={items} onSelect={onSelect} kit={CONTEXT_KIT} />
        </ContextMenuContent>
      </ContextMenu>
    );
  }
  return (
    <ContextMenu items={items} onSelect={onSelect} label={label} areaClassName="fg-row-area">
      {children}
    </ContextMenu>
  );
}

/** The "⋯" at the end of a row: shown on hover, on focus, or on the current row. */
export function RowMore({
  items,
  onSelect,
  label,
  open,
  onOpenChange,
  className,
}: RowMenuProps & { open: boolean; onOpenChange: (open: boolean) => void; className?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <Stop className={cx("fg-row-more", className)}>
      <ActionMenu
        items={items}
        onSelect={onSelect}
        label={label}
        open={open}
        onOpenChange={onOpenChange}
        align="end"
        trigger={<IconButton icon={MoreHorizontalIcon} size="sm" label={label} tabIndex={-1} />}
      />
    </Stop>
  );
}

/** Shift+F10 or the menu key: the keyboard's right click. */
export const isMenuKey = (event: KeyboardEvent) =>
  event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
