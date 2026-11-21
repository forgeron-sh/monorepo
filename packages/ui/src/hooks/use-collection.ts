// The keyboard and the selection of a list of items, in one hook: a focus that moves with the
// arrows, Home, End and typeahead, a selection that is none, one or many (⌘/Ctrl click toggles,
// Shift click and Shift + arrows take a range, ⌘/Ctrl A takes all, Escape clears), Enter that acts.
// Role-agnostic: it returns props for the container and for each item, and the caller picks the
// markup (listbox and option, grid and row, a list of cards).

import {
  useId,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  type RefCallback,
} from "react";
import {
  COLLECTION_TYPEAHEAD_MS,
  collectionMove,
  collectionTypeahead,
  selectionAfterClick,
  type CollectionOrientation,
} from "../collection-model";
import { useControllableState } from "./use-controllable";

export type CollectionSelectionMode = "none" | "single" | "multiple";

/** How a pick was made: a modifier click toggles, Shift extends a range from the anchor. */
export interface CollectionPick {
  mod?: boolean;
  shift?: boolean;
}

export interface UseCollectionOptions<T> {
  /** The items in the order they are shown. */
  items: ReadonlyArray<T>;
  /** The id of an item: unique in the list. */
  getId: (item: T) => string;
  /** What typeahead matches (the name shown); without it typing does nothing. */
  getText?: (item: T) => string;
  /** `none`, `single` (default) or `multiple` (⌘/Ctrl click, Shift click, ⌘/Ctrl A). */
  selectionMode?: CollectionSelectionMode;
  /** The ids selected, when the caller owns them. */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (ids: string[]) => void;
  /** The item that has the focus, when the caller owns it; `null` for none. */
  focused?: string | null;
  onFocusedChange?: (id: string | null) => void;
  /** Enter on the focused item, and a double click on one. */
  onAction?: (id: string) => void;
  /** `vertical` (up and down), `horizontal` (left and right) or `grid` (all four). */
  orientation?: CollectionOrientation;
  /** Items per row of a `grid`; without it the rows are read from the page. */
  columns?: number;
  /**
   * `roving`: the items hold the focus, one tab stop (a grid, a table). `activedescendant`: the
   * container holds it and points at the item (a long list, a listbox).
   */
  focusMode?: "roving" | "activedescendant";
  /** With `activedescendant`, the first item counts as focused before anything is. */
  focusFirst?: boolean;
  /** Moving the focus selects (one: that item; Shift: the range). Default `true`. */
  followFocus?: boolean;
  /** A double click on an item calls `onAction`, as Enter does. Default `true`. */
  actOnDoubleClick?: boolean;
  /** Escape clears the selection. Default `true`; turn off when the selection is not the list's to drop. */
  clearOnEscape?: boolean;
  /** `j` and `k` move down and up in a vertical list. */
  vimKeys?: boolean;
  /** Typed letters jump to an item by its text; on when `getText` is given. */
  typeahead?: boolean;
  /** Events whose target this says yes to are left to it: a field, a button inside an item. */
  ignoreTarget?: (target: HTMLElement) => boolean;
}

export interface Collection {
  /** The ids selected that are still in the list, in the order they were picked. */
  selected: string[];
  selectedSet: ReadonlySet<string>;
  isSelected: (id: string) => boolean;
  /** The item the focus is on; `null` when none yet. */
  focusedId: string | null;
  isFocused: (id: string) => boolean;
  /** The focused item, or the first selected, or (with `focusFirst`) the first: `aria-activedescendant`. */
  activeId: string | null;
  /** The one item with `tabIndex` 0 in `roving` mode. */
  tabStopId: string | null;
  setSelected: (ids: ReadonlyArray<string>) => void;
  /** Picks an item as a click would: alone, or toggled, or the run from the anchor. */
  select: (id: string, how?: CollectionPick) => void;
  /** Adds the item to the selection, or takes it out. */
  toggle: (id: string) => void;
  selectAll: () => void;
  clear: () => void;
  /** Moves the focus to an item (and the page's focus with it, in `roving` mode). */
  focus: (id: string) => void;
  /** The DOM id of an item, in `activedescendant` mode. */
  itemDomId: (id: string) => string;
  /** Props for the container; the handlers you give run first, and `preventDefault()` skips ours. */
  getContainerProps: (
    props?: HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> },
  ) => HTMLAttributes<HTMLElement> & { ref: RefCallback<HTMLElement> };
  /** Props for an item; the same rule for the handlers you give. */
  getItemProps: (id: string, props?: HTMLAttributes<HTMLElement>) => HTMLAttributes<HTMLElement>;
}

const ITEM = "data-collection-item";

/** The keyboard, the focus and the selection of `items`. */
export function useCollection<T>({
  items,
  getId,
  getText,
  selectionMode = "single",
  selected,
  defaultSelected = [],
  onSelectedChange,
  focused,
  onFocusedChange,
  onAction,
  orientation = "vertical",
  columns,
  focusMode = "roving",
  focusFirst = false,
  followFocus = true,
  actOnDoubleClick = true,
  clearOnEscape = true,
  vimKeys = false,
  typeahead,
  ignoreTarget,
}: UseCollectionOptions<T>): Collection {
  const base = useId();
  const container = useRef<HTMLElement | null>(null);
  const anchor = useRef<string | null>(null);
  const typed = useRef({ text: "", at: 0 });
  const [picked, setPicked] = useControllableState<ReadonlyArray<string>>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: (ids) => onSelectedChange?.([...ids]),
  });
  const [focusedRaw, setFocused] = useControllableState<string | null>({
    value: focused,
    defaultValue: null,
    onChange: (id) => onFocusedChange?.(id),
  });

  const ids = items.map(getId);
  const known = new Set(ids);
  const selection = selectionMode === "none" ? [] : picked.filter((id) => known.has(id));
  const selectedSet = new Set(selection);
  const focusedId = focusedRaw !== null && known.has(focusedRaw) ? focusedRaw : null;
  const activeId = focusedId ?? selection[0] ?? (focusFirst ? (ids[0] ?? null) : null);
  const tabStopId = activeId ?? ids[0] ?? null;
  const roving = focusMode === "roving";
  const domId = (id: string) => `${base}-${id}`;

  const setSelection = (next: ReadonlyArray<string>) => {
    if (selectionMode !== "none") setPicked(next);
  };

  const select = (id: string, { mod = false, shift = false }: CollectionPick = {}) => {
    if (selectionMode === "none") return;
    if (selectionMode === "single") {
      setSelection([id]);
      anchor.current = id;
      return;
    }
    setSelection(selectionAfterClick(selection, ids, id, { shift, mod }, anchor.current));
    if (!shift) anchor.current = id;
  };

  const toggle = (id: string) => {
    if (selectionMode === "none") return;
    setSelection(
      selectionMode === "single"
        ? [id]
        : selectionAfterClick(selection, ids, id, { mod: true }, null),
    );
    anchor.current = id;
  };

  const elements = () =>
    Array.from(container.current?.querySelectorAll<HTMLElement>(`[${ITEM}]`) ?? []);

  const focus = (id: string) => {
    setFocused(id);
    if (roving)
      elements()
        .find((el) => el.getAttribute(ITEM) === id)
        ?.focus();
    else document.getElementById(domId(id))?.scrollIntoView?.({ block: "nearest" });
  };

  /** The index one row down or up of a grid read from the page: the nearest item of the next row. */
  const rowStep = (at: number, dir: 1 | -1) => {
    const els = elements();
    const from = els[at]?.getBoundingClientRect();
    if (!from) return at;
    const down = dir === 1;
    const rows = els
      .map((el, i) => ({ i, r: el.getBoundingClientRect() }))
      .filter(({ r }) => (down ? r.top > from.top + 1 : r.top < from.top - 1));
    if (rows.length === 0) return from.height === 0 ? at + dir : at;
    const edge = down
      ? Math.min(...rows.map(({ r }) => r.top))
      : Math.max(...rows.map(({ r }) => r.top));
    const line = rows.filter(({ r }) => Math.abs(r.top - edge) < 2);
    line.sort((a, b) => Math.abs(a.r.left - from.left) - Math.abs(b.r.left - from.left));
    return line[0]!.i;
  };

  const moveTo = (next: string, event: { shiftKey: boolean; mod: boolean }) => {
    focus(next);
    if (selectionMode === "none") return;
    if (event.shiftKey && selectionMode === "multiple") {
      select(next, { shift: true });
    } else if (!event.mod && followFocus) {
      select(next);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (event.defaultPrevented || event.altKey || ignoreTarget?.(target)) return;
    const mod = event.metaKey || event.ctrlKey;
    const itemId = roving ? (target.closest?.(`[${ITEM}]`)?.getAttribute(ITEM) ?? null) : null;
    const currentId = itemId ?? activeId;
    const at = currentId ? ids.indexOf(currentId) : -1;
    const k = event.key;
    const typing =
      typed.current.text !== "" && Date.now() - typed.current.at <= COLLECTION_TYPEAHEAD_MS;

    const to =
      k.length === 1 && mod
        ? null
        : collectionMove(k, at, ids.length, {
            orientation,
            columns,
            vimKeys,
            rowStep: orientation === "grid" ? rowStep : undefined,
          });
    if (to !== null) {
      const next = ids[to];
      if (next && next !== currentId) {
        // The anchor of a range started with the keyboard is where the focus was.
        if (event.shiftKey && anchor.current === null) anchor.current = currentId;
        moveTo(next, { shiftKey: event.shiftKey, mod });
      }
      event.preventDefault();
      return;
    }
    if (mod && k.toLowerCase() === "a") {
      if (selectionMode !== "multiple") return;
      setSelection(ids);
    } else if (k === "Escape") {
      if (!clearOnEscape || selection.length === 0) return;
      setSelection([]);
    } else if (k === "Enter") {
      if (!currentId || !onAction) return;
      onAction(currentId);
    } else if (k === " " && !typing) {
      if (!currentId || selectionMode === "none") return;
      if (mod) toggle(currentId);
      else select(currentId);
    } else if (k.length === 1 && !mod && getText && typeahead !== false) {
      const now = Date.now();
      const word = (now - typed.current.at > COLLECTION_TYPEAHEAD_MS ? "" : typed.current.text) + k;
      typed.current = { text: word, at: now };
      const found = collectionTypeahead(items.map(getText), at, word);
      const next = found >= 0 ? ids[found] : undefined;
      if (next && next !== currentId) moveTo(next, { shiftKey: false, mod: false });
    } else return;
    event.preventDefault();
  };

  const getContainerProps: Collection["getContainerProps"] = ({ ref, ...props } = {}) => ({
    ...(roving ? {} : { tabIndex: 0 }),
    ...(!roving && activeId ? { "aria-activedescendant": domId(activeId) } : {}),
    ...props,
    ref: (node) => {
      container.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLElement | null }).current = node;
    },
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      onKeyDown(event);
    },
  });

  const getItemProps: Collection["getItemProps"] = (id, props = {}) => ({
    ...props,
    id: props.id ?? domId(id),
    [ITEM]: id,
    ...(selectionMode === "none" ? {} : { "aria-selected": selectedSet.has(id) }),
    ...(roving ? { tabIndex: id === tabStopId ? 0 : -1 } : {}),
    onClick: (event: MouseEvent<HTMLElement>) => {
      props.onClick?.(event);
      if (event.defaultPrevented || ignoreTarget?.(event.target as HTMLElement)) return;
      select(id, { shift: event.shiftKey, mod: event.metaKey || event.ctrlKey });
      setFocused(id);
    },
    onDoubleClick: (event: MouseEvent<HTMLElement>) => {
      props.onDoubleClick?.(event);
      if (event.defaultPrevented || ignoreTarget?.(event.target as HTMLElement)) return;
      if (actOnDoubleClick) onAction?.(id);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      props.onFocus?.(event);
      if (event.target !== event.currentTarget) return;
      setFocused(id);
      // Tabbing onto an item picks it when the focus carries the selection.
      if (selectionMode === "single" && followFocus && !selectedSet.has(id)) select(id);
    },
  });

  return {
    selected: selection,
    selectedSet,
    isSelected: (id) => selectedSet.has(id),
    focusedId,
    isFocused: (id) => id === focusedId,
    activeId,
    tabStopId,
    setSelected: setSelection,
    select,
    toggle,
    selectAll: () => {
      if (selectionMode === "multiple") setSelection(ids);
    },
    clear: () => setSelection([]),
    focus,
    itemDomId: domId,
    getContainerProps,
    getItemProps,
  };
}
