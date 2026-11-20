// A tree of rows that open and close: the parts (Tree, TreeItem, TreeItemContent, TreeGroup,
// TreeItemIndicator), D-156 and D-157. Base UI has no tree, so the WAI-ARIA tree pattern is here:
// one tab stop that moves with the focus, the arrows, Home, End, `*`, typeahead, Enter and Space.
// The nesting is yours: items inside a group inside an item. The keys read the rows from the page
// (what is shown, in order, at what level), so a flat list with `level` set walks the same way.
// One name, both APIs: `Tree` with `items` is the props-driven form (nodes, lazy children, a drag
// that reorders or reparents, F2 to rename, a context menu, a search), built from these parts;
// without `items` it is the root of the parts.

import { useRender } from "@base-ui/react/use-render";
import {
  ArrowRight01Icon,
  File01Icon,
  Folder01Icon,
  LockIcon,
  type IconDefinition,
} from "@forgeron/icons";
import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import type { ActionMenuEntry } from "./action-menu";
import { ContextMenu } from "./context-menu";
import { cx } from "./cx";
import { Spinner } from "./feedback";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";
import { useSortable } from "./sortable";
import {
  TREE_TYPEAHEAD_MS,
  treeNavigate,
  treeRangeIds,
  treeSiblingBranches,
  treeTypeahead,
  type TreeRow,
} from "./tree-model";
import {
  structureDropPlacement,
  structureFilter,
  structureFind,
  structureFlatten,
  structureHighlight,
  structureIds,
  structureMove,
  structurePath,
  structureShift,
  structureToggle,
  type StructureDropZone,
  type StructureShift,
} from "./tree-items-model";

// A layout effect that stays quiet when the tree is drawn on a server.
const useSafeLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

export type TreeSelectionMode = "none" | "single" | "multiple";

/** How a pick was made: a modifier click or Ctrl/Cmd Space toggles, Shift extends a range. */
export interface TreePick {
  mod?: boolean;
  range?: boolean;
}

interface TreeContextValue {
  expanded: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  selectionMode: TreeSelectionMode;
  stopId: string | null;
  setStopId: (id: string) => void;
  toggle: (id: string, open?: boolean) => void;
  select: (id: string, how?: TreePick) => void;
  focus: (id: string) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

/** The tree's state and actions, for a part of your own inside it: a fold button, a custom row. */
export function useTree(): TreeContextValue {
  const ctx = use(TreeContext);
  if (!ctx) throw new Error("useTree is used inside a Tree.");
  return ctx;
}

interface ItemContextValue {
  id: string;
  level: number;
  branch: boolean;
  expanded: boolean;
  selected: boolean;
  disabled: boolean;
}

const ItemContext = createContext<ItemContextValue | null>(null);
// Level of the rows being drawn: 0 at the root, an item's own level for what is inside it.
const LevelContext = createContext(0);
const PositionContext = createContext<{ position: number; size: number } | null>(null);

/** The item a part is inside: its id, level, open and selected state. */
export function useTreeItem(): ItemContextValue {
  const ctx = use(ItemContext);
  if (!ctx) throw new Error("useTreeItem is used inside a TreeItem.");
  return ctx;
}

/* ------------------------------------------------------------------------------- the page */

const ROW = '[role="treeitem"]';

/** The rows that are on screen, in order, with the element of each. */
function readItems(root: HTMLElement | null): { el: HTMLElement; row: TreeRow }[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(ROW)).map((el) => ({
    el,
    row: {
      id: el.dataset.treeId ?? "",
      level: Number(el.getAttribute("aria-level")) || 1,
      branch: el.hasAttribute("aria-expanded"),
      expanded: el.getAttribute("aria-expanded") === "true",
      disabled: el.getAttribute("aria-disabled") === "true",
      text: el.dataset.treeText ?? el.textContent ?? "",
    },
  }));
}

/** Moves the focus to the row with this id, inside `root`. Returns whether there was one. */
export function focusTreeItem(root: HTMLElement | null, id: string): boolean {
  const hit = readItems(root).find((i) => i.row.id === id);
  hit?.el.focus();
  return !!hit;
}

/* ---------------------------------------------------------------------------------- Tree */

type Part<T> = Omit<T, "className"> & { className?: string };

export interface TreeRootProps extends Part<
  Omit<ComponentProps<"ul">, "onSelect" | "defaultValue" | "ref">
> {
  /** The ids of the open items. */
  expanded?: ReadonlyArray<string>;
  defaultExpanded?: ReadonlyArray<string>;
  onExpandedChange?: (ids: string[]) => void;
  /** The ids of the selected items. */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (ids: string[]) => void;
  /** `single` (default): one at a time. `multiple`: Space, Cmd/Ctrl click, Shift click and arrows. `none`: focus only. */
  selectionMode?: TreeSelectionMode;
  /** Enter on an item that is not disabled, after it is selected. */
  onActivate?: (id: string) => void;
  /** Names the tree for assistive technology. */
  "aria-label"?: string;
  /** Draws another element in place of the `ul`: a `div` for a flat list. */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
  /** Stays undefined: with `items`, `Tree` is the props-driven form (`TreeProps`). */
  items?: undefined;
}

/** Counts the items among the children, so each knows its place in its set. */
function positioned(children: ReactNode): ReactNode {
  const list = Children.toArray(children);
  const size = list.filter((c) => isValidElement(c) && c.type === TreeItem).length;
  let position = 0;
  return list.map((child) => {
    if (!isValidElement(child) || child.type !== TreeItem) return child;
    position += 1;
    return (
      <PositionContext.Provider key={child.key} value={{ position, size }}>
        {child}
      </PositionContext.Provider>
    );
  });
}

/**
 * The root of the parts: holds what is open and what is selected (controlled or not), and the keyboard. Arrows
 * walk the rows, Right and Left open, close and climb, Home and End jump, `*` opens the siblings,
 * a typed word finds a row, Enter and Space pick. Keys typed in an input inside a row are left alone.
 */
export function TreeRoot({
  items: _items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = [],
  onSelectedChange,
  selectionMode = "single",
  onActivate,
  render,
  className,
  children,
  onKeyDown,
  ref,
  ...rest
}: TreeRootProps) {
  const [open, setOpen] = useControllableState<ReadonlyArray<string>>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: (ids) => onExpandedChange?.([...ids]),
  });
  const [picked, setPicked] = useControllableState<ReadonlyArray<string>>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (ids) => onSelectedChange?.([...ids]),
  });
  const [stopId, setStopId] = useState<string | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const anchor = useRef<string | null>(null);
  const typed = useRef({ text: "", at: 0 });

  const openSet = new Set(open);
  const pickedSet = new Set(picked);

  // One row is the tab stop: the one last focused, else the first selected, else the first.
  useSafeLayoutEffect(() => {
    const ids = readItems(root.current).map((i) => i.row.id);
    if (ids.length === 0) return;
    const next =
      stopId && ids.includes(stopId) ? stopId : (ids.find((id) => pickedSet.has(id)) ?? ids[0]!);
    if (next !== stopId) setStopId(next);
  });

  const focus = (id: string) => {
    setStopId(id);
    focusTreeItem(root.current, id);
  };

  const toggle = (id: string, next?: boolean) => {
    const on = next ?? !openSet.has(id);
    if (on === openSet.has(id)) return;
    setOpen(on ? [...open, id] : open.filter((x) => x !== id));
  };

  const select = (id: string, how: TreePick = {}) => {
    if (selectionMode === "none") return;
    const items = readItems(root.current).map((i) => i.row);
    const at = items.findIndex((r) => r.id === id);
    if (at === -1 || items[at]!.disabled) return;
    if (selectionMode === "multiple" && how.range) {
      const from = items.findIndex((r) => r.id === (anchor.current ?? id));
      if (from !== -1) {
        setPicked(treeRangeIds(items, from, at));
        return;
      }
    }
    anchor.current = id;
    if (selectionMode === "multiple" && how.mod) {
      setPicked(pickedSet.has(id) ? picked.filter((x) => x !== id) : [...picked, id]);
    } else {
      setPicked([id]);
    }
  };

  const keyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    // Only a row that has the focus: not a button or a field inside it.
    if (target.getAttribute("role") !== "treeitem") return;
    const mod = event.metaKey || event.ctrlKey;
    if (event.altKey) return;
    const items = readItems(root.current);
    const rows = items.map((i) => i.row);
    const at = rows.findIndex((r) => r.id === target.dataset.treeId);
    const row = rows[at];
    if (!row) return;
    const { key } = event;
    const multiple = selectionMode === "multiple";

    const go = (to: number) => {
      const next = rows[to];
      if (!next) return;
      focus(next.id);
      if (multiple && event.shiftKey && (key === "ArrowDown" || key === "ArrowUp")) {
        if (!anchor.current) anchor.current = row.id;
        select(next.id, { range: true });
      }
    };

    if (!mod && (key.startsWith("Arrow") || key === "Home" || key === "End")) {
      const move = treeNavigate(rows, at, key);
      if (!move) return;
      if (move.focus !== undefined) go(move.focus);
      if (move.expand) toggle(move.expand, true);
      if (move.collapse) toggle(move.collapse, false);
    } else if (key === "Enter" && !mod) {
      if (!row.disabled) {
        select(row.id, { range: event.shiftKey });
        onActivate?.(row.id);
      }
    } else if (key === "Enter") {
      select(row.id, { mod: true });
    } else if (key === " ") {
      select(row.id, { mod: multiple, range: multiple && event.shiftKey });
    } else if (key === "*" && !mod) {
      const siblings = treeSiblingBranches(rows, at)
        .map((r) => r.id)
        .filter((id) => !openSet.has(id));
      if (siblings.length > 0) setOpen([...open, ...siblings]);
    } else if ((key === "a" || key === "A") && mod) {
      if (!multiple) return;
      setPicked(rows.filter((r) => !r.disabled).map((r) => r.id));
    } else if (key.length === 1 && !mod) {
      const now = Date.now();
      const text = now - typed.current.at > TREE_TYPEAHEAD_MS ? key : typed.current.text + key;
      typed.current = { text, at: now };
      const hit = treeTypeahead(rows, at, text);
      if (hit === -1) return;
      focus(rows[hit]!.id);
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const value: TreeContextValue = {
    expanded: openSet,
    selected: pickedSet,
    selectionMode,
    stopId,
    setStopId,
    toggle,
    select,
    focus,
  };

  const element = useRender({
    defaultTagName: "ul",
    render,
    ref: ref ? [ref, root] : root,
    props: {
      role: "tree",
      ...(selectionMode === "multiple" ? { "aria-multiselectable": true } : {}),
      ...rest,
      className: cx("fg-tree", className),
      onKeyDown: keyDown,
      children: positioned(children),
    },
  });

  return (
    <TreeContext value={value}>
      <LevelContext value={0}>{element}</LevelContext>
    </TreeContext>
  );
}

/* ------------------------------------------------------------------------------ TreeItem */

export interface TreeItemProps extends Part<Omit<ComponentProps<"li">, "id" | "ref">> {
  /** Names the item for the tree: what is open, selected and focused. Not the DOM `id`. */
  id: string;
  /** What a typed word is matched against. Default: the text of the row. */
  textValue?: string;
  /** Seen and focused, but not selected nor activated. */
  disabled?: boolean;
  /**
   * Whether the item has children. Default: it has a `TreeGroup` among its children. Say it for
   * children that load on opening, or for a flat list whose rows you indent yourself.
   */
  hasChildren?: boolean;
  /** Depth, 1 for the top. Default: one more than the item it is inside. Set it on a flat list. */
  level?: number;
  /** How many items in its set. Default: counted among the `TreeItem`s of the same parent. */
  setSize?: number;
  /** Place in its set, from 1. Default: counted as `setSize`. */
  position?: number;
  /**
   * The item is itself the row (a flat list): a click on it focuses and selects it, as a click on
   * a `TreeItemContent` does. `event.preventDefault()` in `onClick` skips the pick.
   */
  pickOnClick?: boolean;
  /** Draws another element in place of the `li`: a `div` for a flat list. */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
}

/** One node: a `TreeItemContent` and, to nest, a `TreeGroup` of more items. */
export function TreeItem({
  id,
  textValue,
  disabled = false,
  hasChildren,
  level,
  setSize,
  position,
  pickOnClick,
  render,
  className,
  children,
  onFocus,
  onClick,
  ref,
  ...rest
}: TreeItemProps) {
  const tree = useTree();
  const parentLevel = use(LevelContext);
  const place = use(PositionContext);
  const at = level ?? parentLevel + 1;
  const branch =
    hasChildren ??
    Children.toArray(children).some((c) => isValidElement(c) && c.type === TreeGroup);
  const open = branch && tree.expanded.has(id);
  const on = tree.selected.has(id);
  const size = setSize ?? place?.size;
  const pos = position ?? place?.position;
  // Before the first focus nothing is the tab stop yet: the first top row is.
  const stop = tree.stopId === null ? at === 1 && pos === 1 : tree.stopId === id;

  const element = useRender({
    defaultTagName: "li",
    render,
    ref,
    props: {
      role: "treeitem",
      "data-tree-id": id,
      ...(textValue !== undefined ? { "data-tree-text": textValue } : {}),
      "aria-level": at,
      ...(size !== undefined ? { "aria-setsize": size } : {}),
      ...(pos !== undefined ? { "aria-posinset": pos } : {}),
      ...(tree.selectionMode !== "none" ? { "aria-selected": on } : {}),
      ...(branch ? { "aria-expanded": open } : {}),
      ...(disabled ? { "aria-disabled": true } : {}),
      "data-selected": on ? "" : undefined,
      "data-expanded": open ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      tabIndex: stop ? 0 : -1,
      ...rest,
      className: cx("fg-tree-item", className),
      onFocus: (event: React.FocusEvent<HTMLElement>) => {
        onFocus?.(event as never);
        if (event.target === event.currentTarget) tree.setStopId(id);
      },
      onClick: (event: MouseEvent<HTMLElement>) => {
        onClick?.(event as never);
        if (!pickOnClick || event.defaultPrevented) return;
        tree.select(id, { mod: event.metaKey || event.ctrlKey, range: event.shiftKey });
      },
      children,
    },
  });

  return (
    <ItemContext value={{ id, level: at, branch, expanded: open, selected: on, disabled }}>
      <LevelContext value={at}>{element}</LevelContext>
    </ItemContext>
  );
}

/* ------------------------------------------------------------------------ the row and more */

export interface TreeItemIndicatorProps extends Part<Omit<ComponentProps<"span">, "ref">> {
  /** Your own mark in place of the chevron; it turns a quarter when the item is open. */
  children?: ReactNode;
}

/** The chevron that opens and closes the item; empty for an item without children. */
export function TreeItemIndicator({
  className,
  children,
  onClick,
  ...rest
}: TreeItemIndicatorProps) {
  const tree = useTree();
  const item = useTreeItem();
  return (
    <span
      aria-hidden="true"
      {...rest}
      className={cx("fg-tree-twisty", item.expanded && "fg-tree-twisty-open", className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !item.branch) return;
        event.stopPropagation();
        tree.toggle(item.id);
        tree.focus(item.id);
      }}
    >
      {item.branch ? (children ?? <Icon icon={ArrowRight01Icon} size={12} variant="mono" />) : null}
    </span>
  );
}

export interface TreeItemContentProps extends Part<Omit<ComponentProps<"div">, "ref">> {
  /** Shows the chevron before the content. Default `true`. */
  indicator?: boolean;
  /** The one child element is the row (a link, say): it gets the row's props and the chevron. */
  asChild?: boolean;
}

/**
 * The row of an item: indented by its level, with the chevron before what you put in it, and a
 * click that focuses and selects it. Call `event.preventDefault()` in `onClick` to skip the pick.
 */
export function TreeItemContent({
  indicator = true,
  asChild,
  className,
  style,
  children,
  onClick,
  ...rest
}: TreeItemContentProps) {
  const tree = useTree();
  const item = useTreeItem();
  const props = {
    "data-tree-row": item.id,
    ...rest,
    className: cx(
      "fg-tree-row",
      item.selected && "fg-tree-current",
      item.disabled && "fg-tree-off",
      className,
    ),
    style: { "--fg-tree-level": item.level, ...style } as React.CSSProperties,
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      tree.focus(item.id);
      tree.select(item.id, { mod: event.metaKey || event.ctrlKey, range: event.shiftKey });
    },
  };
  const chevron = indicator ? <TreeItemIndicator /> : null;
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(
      children,
      {
        ...props,
        className: cx(props.className, (children.props as { className?: string }).className),
      } as never,
      <>
        {chevron}
        {children.props.children}
      </>,
    );
  }
  return (
    <div {...props}>
      {chevron}
      {children}
    </div>
  );
}

export interface TreeGroupProps extends Part<Omit<ComponentProps<"ul">, "ref">> {
  /** Draws another element in place of the `ul`. */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
}

/** The children of an item: shown while the item is open, nothing when it is closed. */
export function TreeGroup({ render, className, children, ref, ...rest }: TreeGroupProps) {
  const item = use(ItemContext);
  const element = useRender({
    defaultTagName: "ul",
    render,
    ref,
    props: {
      role: "group",
      ...rest,
      className: cx("fg-tree-group", className),
      children: positioned(children),
    },
  });
  if (item && !item.expanded) return null;
  return element;
}

/**
 * With `items`: a tree for any node (pages, folders, teams, fields): arrows, Home, End and
 * typeahead, one or several selected, children loaded on first opening, a drag that reorders or
 * reparents with a drop line (and Alt + arrows for the keyboard), a name edited in place (F2), a
 * right-click menu, counts, and a search that keeps what matches. Without: the root of the parts
 * (`TreeItem`, `TreeItemContent`, `TreeGroup`, `TreeItemIndicator`).
 */
export function Tree<D = unknown>(props: TreeItemsProps<D> | TreeRootProps) {
  return props.items !== undefined ? <TreeFromItems<D> {...props} /> : <TreeRoot {...props} />;
}

/* ------------------------------------------------------------------- the props-driven form */

export interface TreeNode<D = unknown> {
  id: string;
  label: string;
  /** In place of the default: a folder for a node with children, a page for the others. */
  icon?: IconDefinition;
  /** A figure at the end of the row: pages inside, people in a team. */
  count?: number;
  /** Anything at the end of the row, after the count. */
  badge?: ReactNode;
  /**
   * The children. Absent with `hasChildren`: not loaded yet, `onLoadChildren` is called on the
   * first opening.
   */
  children?: ReadonlyArray<TreeNode<D>> | undefined;
  hasChildren?: boolean;
  /** Seen but neither picked nor dropped on. */
  disabled?: boolean;
  /** Shows a lock: no drag, no rename, nothing dropped inside. */
  readOnly?: boolean;
  /** Yours: the record behind the row, handed back to `renderItem`. */
  data?: D;
}

export interface TreeRowState {
  level: number;
  expanded: boolean;
  selected: boolean;
  /** Under the keyboard focus. */
  focused: boolean;
  /** The query, when a search is on. */
  query: string;
}

export interface TreeMove<D = unknown> {
  /** What was moved, in tree order. */
  ids: string[];
  /** Where it landed: under this node (null: the top level), at this place among its children. */
  parentId: string | null;
  index: number;
  /** The whole tree after the move: keep it as your state. */
  items: TreeNode<D>[];
}

export interface TreeItemsProps<D = unknown> {
  items: ReadonlyArray<TreeNode<D>>;
  /** The open nodes. */
  expanded?: ReadonlyArray<string>;
  defaultExpanded?: ReadonlyArray<string>;
  onExpandedChange?: (ids: string[]) => void;
  /** The selected nodes. */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (ids: string[]) => void;
  /** `single` (default), `multiple` (⌘ click, ⇧ click, Space) or `none`: focus only. */
  selectionMode?: "single" | "multiple" | "none";
  /** Enter or a double click. */
  onActivate?: (id: string) => void;
  /** Called the first time a node with `hasChildren` and no `children` opens; a promise shows the wait. */
  onLoadChildren?: (id: string) => void | Promise<unknown>;
  /** What a row shows in place of its label. The icon, the count and the rename stay. */
  renderItem?: (node: TreeNode<D>, state: TreeRowState) => ReactNode;
  /**
   * A drag, or Alt + arrows, moved nodes. Giving it turns both on; the tree does not change
   * itself: keep `items` from the move.
   */
  onMove?: (move: TreeMove<D>) => void;
  /** Whether a drop is allowed; every drop that does not put a node inside itself by default. */
  canDrop?: (ids: string[], targetId: string, zone: StructureDropZone) => boolean;
  /** A new name, from F2 or from `renaming`. Giving it turns the rename on. */
  onRename?: (id: string, label: string) => void;
  /** The node being renamed, when you start the rename from a menu. */
  renaming?: string | null;
  onRenamingChange?: (id: string | null) => void;
  /** The actions of the selection, behind a right click. Give `useActions(…).menu`. */
  menu?: (ids: string[]) => ActionMenuEntry[];
  onAction?: (actionId: string, ids: string[]) => void;
  /** Keeps the nodes whose label holds this text, marks it, and opens the way to them. */
  filter?: string;
  /** Shown when nothing is left. */
  empty?: ReactNode;
  /** Names the tree for assistive technology. */
  label?: string;
  className?: string;
}

/** The props-driven form: `Tree` with `items`. */
export type TreeProps<D = unknown> = TreeItemsProps<D>;

const DRAG_TYPE = "application/x-forgeron-tree";

interface Branchy {
  children?: ReadonlyArray<unknown> | undefined;
  hasChildren?: boolean | undefined;
}
const isLoaded = (n: Branchy) => n.children !== undefined;
const isBranch = (n: Branchy) => (n.children ? n.children.length > 0 : !!n.hasChildren);

/** Names the one the tree moved, for the live region. */
const placeText = (label: string, parent: string | null, index: number, size: number) =>
  `${label} moved ${parent ? `into ${parent}` : "to the top level"}, position ${index + 1} of ${size}`;

/** The tree for any node: pages, folders, teams, fields. */
function TreeFromItems<D = unknown>({
  items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = [],
  onSelectedChange,
  selectionMode = "single",
  onActivate,
  onLoadChildren,
  renderItem,
  onMove,
  canDrop,
  onRename,
  renaming,
  onRenamingChange,
  menu,
  onAction,
  filter = "",
  empty,
  label = "Tree",
  className,
}: TreeItemsProps<D>) {
  type N = TreeNode<D>;
  const [openIds, setOpenIds] = useControllableState<ReadonlyArray<string>>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: (ids) => onExpandedChange?.([...ids]),
  });
  const [picked, setPicked] = useControllableState<ReadonlyArray<string>>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (ids) => onSelectedChange?.([...ids]),
  });
  const [editing, setEditing] = useControllableState<string | null>({
    value: renaming,
    defaultValue: null,
    onChange: (id) => onRenamingChange?.(id),
  });
  const [focusId, setFocusId] = useState<string | null>(null);
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const root = useRef<HTMLElement>(null);
  const cancelled = useRef(false);

  const found = structureFilter(items, filter, (n) => n.label);
  const open = new Set([...openIds, ...(found?.open ?? [])]);
  const rows = structureFlatten(items, open, found?.visible ?? null);
  const pickedSet = new Set(picked);
  const selectable = selectionMode !== "none";
  const moving = !!onMove;

  const focusItem = (id: string) => focusTreeItem(root.current, id);

  const load = (id: string) => {
    const node = structureFind(items, id);
    if (!node || isLoaded(node) || !node.hasChildren || !onLoadChildren || loading.has(id)) return;
    const wait = onLoadChildren(id);
    if (wait && typeof (wait as Promise<unknown>).then === "function") {
      setLoading((s) => new Set(s).add(id));
      const done = () =>
        setLoading((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      (wait as Promise<unknown>).then(done, done);
    }
  };

  // The tree says which nodes are open now (the ones a search opened included): keep what the
  // caller opened and closed, and load the children of what just opened.
  const applyOpen = (ids: string[]) => {
    const now = new Set(ids);
    let next: ReadonlyArray<string> = openIds;
    for (const id of ids) {
      if (open.has(id)) continue;
      next = structureToggle(next, id, true);
      load(id);
    }
    for (const id of open) if (!now.has(id)) next = structureToggle(next, id, false);
    setOpenIds(next);
  };

  /** Which nodes a drag of `id` carries: the selection, when the node is part of it. */
  const carried = (id: string) => {
    const base = pickedSet.has(id) && selectionMode === "multiple" ? [...picked] : [id];
    const set = new Set(base);
    // A node already inside another moved node goes with it.
    const top = base.filter((x) => !(structurePath(items, x) ?? []).some((p) => set.has(p)));
    return structureIds(items).filter((x) => top.includes(x));
  };

  const commitMove = (moveIds: string[], parentId: string | null, index: number) => {
    const next = structureMove(items, moveIds, { parentId, index });
    if (!next || !onMove) return false;
    const list = (parentId ? structureFind(next, parentId)?.children : next) ?? [];
    const at = list.findIndex((n) => n.id === moveIds[0]);
    onMove({ ids: moveIds, parentId, index: at, items: next as N[] });
    const parent = parentId ? structureFind(next, parentId) : null;
    if (parent) setOpenIds(structureToggle(openIds, parent.id, true));
    const first = structureFind(next, moveIds[0]!);
    sortable.announce(placeText(first?.label ?? "", parent?.label ?? null, at, list.length));
    return true;
  };

  // A drag reorders or reparents: a row drops before, inside or after another. Alt + arrows are
  // the tree's own (below), as a move there can also indent and outdent.
  const sortable = useSortable({
    items: rows,
    getId: (row) => row.node.id,
    getLabel: (row) => row.node.label,
    keyboard: false,
    drag: moving,
    dragType: DRAG_TYPE,
    disabled: (id) => {
      const node = structureFind(items, id);
      return !node || !!node.readOnly || !!node.disabled || editing === id;
    },
    nest: (id) => {
      const node = structureFind(items, id);
      return !!node && !node.readOnly && !node.disabled;
    },
    canDrop: (dragId, overId, zone) => {
      const moved = carried(dragId);
      const place = structureDropPlacement(items, overId, zone);
      return (
        !!place &&
        !moved.includes(overId) &&
        !!structureMove(items, moved, place) &&
        (!canDrop || canDrop(moved, overId, zone))
      );
    },
    onItemDrop: ({ id, overId, position }) => {
      const place = structureDropPlacement(items, overId, position);
      if (place) commitMove(carried(id), place.parentId, place.index);
    },
  });
  const dragIds = sortable.dragging ? carried(sortable.dragging) : null;

  // A closed branch opens after a moment under the pointer, to drop deeper.
  const overId = sortable.over?.id;
  const overInside = sortable.over?.position === "inside";
  useEffect(() => {
    const node = overId && overInside ? structureFind(items, overId) : null;
    if (!node || !isBranch(node) || open.has(node.id)) return;
    const timer = setTimeout(() => applyOpen([...open, node.id]), 700);
    return () => clearTimeout(timer);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reads the tree as it is when the pointer settles
  }, [overId, overInside]);

  const startRename = (id: string) => {
    const node = structureFind(items, id);
    if (!onRename || !node || node.readOnly || node.disabled) return false;
    cancelled.current = false;
    setEditing(id);
    return true;
  };

  const endRename = (node: N, value: string | null) => {
    setEditing(null);
    const next = value?.trim();
    if (next && next !== node.label) onRename?.(node.id, next);
    requestAnimationFrame(() => focusItem(node.id));
  };

  // What the tree does not know: Alt + arrows move the node, F2 renames it.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).tagName === "INPUT") return;
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-id]");
    const node = el ? structureFind(items, el.dataset.treeId!) : null;
    if (!node) return;

    if (event.altKey && moving && event.key.startsWith("Arrow")) {
      const dirs: Record<string, StructureShift> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowRight: "in",
        ArrowLeft: "out",
      };
      const dir = dirs[event.key] ?? null;
      event.preventDefault();
      event.stopPropagation();
      if (dir && !node.readOnly && !node.disabled) {
        const shift = structureShift(items, node.id, dir);
        if (shift) {
          const parent = shift.parentId ? structureFind(shift.items, shift.parentId) : null;
          onMove({
            ids: [node.id],
            parentId: shift.parentId,
            index: shift.index,
            items: shift.items as N[],
          });
          if (parent) setOpenIds(structureToggle(openIds, parent.id, true));
          const size = (parent ? parent.children : shift.items)?.length ?? 0;
          sortable.announce(placeText(node.label, parent?.label ?? null, shift.index, size));
          requestAnimationFrame(() => focusItem(node.id));
        }
      }
    } else if (event.key === "F2" && startRename(node.id)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onContextMenu = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-row]");
    if (!el) return;
    const id = el.dataset.treeRow!;
    if (selectable && !pickedSet.has(id) && !structureFind(items, id)?.disabled) setPicked([id]);
    setFocusId(id);
  };

  const rowContent = (node: N, state: TreeRowState) => {
    if (editing === node.id) {
      return (
        <input
          className="fg-tree-rename"
          aria-label={`Rename ${node.label}`}
          defaultValue={node.label}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              endRename(node, e.currentTarget.value);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              cancelled.current = true;
              endRename(node, null);
            }
          }}
          onBlur={(e) => {
            if (!cancelled.current) endRename(node, e.currentTarget.value);
            cancelled.current = false;
          }}
        />
      );
    }
    if (renderItem) return renderItem(node, state);
    return (
      <span className="fg-tree-name">
        {structureHighlight(node.label, filter).map((s, i) =>
          s.match ? (
            <mark key={i} className="fg-tree-mark">
              {s.text}
            </mark>
          ) : (
            <Fragment key={i}>{s.text}</Fragment>
          ),
        )}
      </span>
    );
  };

  const renderLevel = (nodes: ReadonlyArray<N>, level: number): ReactNode => {
    const shown = found ? nodes.filter((n) => found.visible.has(n.id)) : nodes;
    return shown.map((node) => {
      const branch = isBranch(node);
      const isOpen = branch && open.has(node.id);
      const on = pickedSet.has(node.id);
      const waiting = isOpen && (loading.has(node.id) || !isLoaded(node));
      const zone = sortable.getItemState(node.id).over;
      const state: TreeRowState = {
        level,
        expanded: isOpen,
        selected: on,
        focused: focusId === node.id,
        query: filter,
      };
      return (
        <TreeItem
          key={node.id}
          id={node.id}
          textValue={node.label}
          disabled={!!node.disabled}
          hasChildren={branch}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusId(node.id);
          }}
        >
          <TreeItemContent
            className={cx(
              dragIds?.includes(node.id) && "fg-tree-dragging",
              zone && `fg-tree-drop-${zone}`,
            )}
            onClick={(e) => {
              // A name being typed keeps the click.
              if (editing === node.id) e.preventDefault();
            }}
            onDoubleClick={() => {
              if (!node.disabled && editing !== node.id) onActivate?.(node.id);
            }}
            {...sortable.getItemProps(node.id)}
          >
            <Icon
              icon={node.icon ?? (branch ? Folder01Icon : File01Icon)}
              size={12}
              variant="mono"
              className="fg-tree-icon"
            />
            {rowContent(node, state)}
            {node.readOnly ? (
              <Icon
                icon={LockIcon}
                size={12}
                variant="mono"
                className="fg-tree-lock"
                title="Read-only"
              />
            ) : null}
            {node.count !== undefined ? <span className="fg-tree-count">{node.count}</span> : null}
            {node.badge ? <span className="fg-tree-badge">{node.badge}</span> : null}
          </TreeItemContent>
          {isOpen ? (
            waiting ? (
              <div
                className="fg-tree-loading"
                style={{ paddingLeft: `calc(${level} * var(--fg-tree-indent, 16px) + 24px)` }}
              >
                <Spinner label="Loading" />
              </div>
            ) : (
              <TreeGroup>{renderLevel(node.children ?? [], level + 1)}</TreeGroup>
            )
          ) : null}
        </TreeItem>
      );
    });
  };

  const list = (
    <TreeRoot
      ref={root}
      aria-label={label}
      className={className}
      expanded={[...open]}
      onExpandedChange={applyOpen}
      selected={picked}
      onSelectedChange={(ids) => setPicked(ids)}
      selectionMode={selectionMode}
      onActivate={onActivate}
      onKeyDown={onKeyDown}
      onContextMenu={menu ? onContextMenu : undefined}
    >
      {renderLevel(items, 1)}
    </TreeRoot>
  );

  const body = (
    <>
      {rows.length === 0 && empty ? <div className="fg-tree-empty">{empty}</div> : list}
      <span className="fg-visually-hidden" role="status" aria-live="polite">
        {sortable.status}
      </span>
    </>
  );

  if (!menu) return body;
  const target = [...picked];
  return (
    <ContextMenu
      items={menu(target)}
      onSelect={(actionId) => onAction?.(actionId, target)}
      label={target.length > 1 ? `Actions on ${target.length} items` : "Actions on the item"}
      areaClassName="fg-tree-area"
    >
      {body}
    </ContextMenu>
  );
}
