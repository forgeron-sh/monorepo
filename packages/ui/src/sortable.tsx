// A list that reorders by drag and by keyboard: the parts (Sortable, SortableItem, SortableHandle,
// SortableDropIndicator, SortableStatus) and `useSortable`, the hook they and the blocks are made
// of (D-156, D-157). Native HTML5 drag; Alt + the arrows move the focused item and the focus
// follows it; every move is said in a polite live region.

import { useRender } from "@base-ui/react/use-render";
import { GripIcon } from "@forgeron/icons";
import {
  createContext,
  Fragment,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";
import {
  clampIndex,
  moveItem,
  sortableAnnouncement,
  sortableDropPosition,
  sortableKeyStep,
  sortableSlotIndex,
  sortableStepTarget,
  type SortableMove,
  type SortableNestRange,
  type SortableOrientation,
  type SortablePosition,
} from "./sortable-model";

/** What a drop asks for: the dragged item, the one under the pointer and where relative to it. */
export interface SortableDrop {
  id: string;
  overId: string;
  position: SortablePosition;
}

export interface UseSortableOptions<T> {
  /** The items in order. The hook never holds them: give the new order back with `onReorder`. */
  items: ReadonlyArray<T>;
  getId: (item: T) => string;
  /** The list in its new order, after a keyboard move or a drop. */
  onReorder?: (next: T[], move: SortableMove) => void;
  /**
   * A drop, as the pointer means it (before, after, inside). Giving it replaces the reorder of a
   * drop with your own (a tree moves a node into another): `onReorder` still serves the keyboard.
   */
  onItemDrop?: (drop: SortableDrop) => void;
  /** The axis of the list: which arrows move an item and which half of a row is "before". */
  orientation?: SortableOrientation;
  /** Names the list for assistive technology. */
  label?: string;
  /** What an item is called in announcements and in the dragged text. Default: its id. */
  getLabel?: (item: T) => string;
  /** The words after a keyboard move or a drop. Default: "Moved Status to position 3 of 5". */
  announce?: (move: SortableMove, item: T, count: number) => string | null;
  /** Items that stay where they are: no drag, no Alt + arrows. All of them, or by id. */
  disabled?: boolean | ((id: string) => boolean);
  /** Only a `SortableHandle` drags; otherwise the whole item does. */
  handle?: boolean;
  /** Pointer drag. Off: the keyboard only. Default `true`. */
  drag?: boolean;
  /** Alt + arrows move the focused item. Off: a list that moves by its own keys. Default `true`. */
  keyboard?: boolean;
  /** Plain arrows move the focus between items. */
  navigate?: boolean;
  /** Alt + Home and Alt + End move to the ends (Home and End move the focus, with `navigate`). */
  homeEnd?: boolean;
  /** The indexes an item may reach, both included: a first row that stays first. */
  range?: readonly [number, number];
  /** Whether a drop here is accepted; false shows no mark and takes no drop. */
  canDrop?: (id: string, overId: string, position: SortablePosition) => boolean;
  /** Read the position from the pointer in the row (before, after) rather than from the order. */
  pointer?: boolean;
  /** Items that take "inside" in the middle of the row: a group, a folder. Reads the pointer. */
  nest?: (id: string) => boolean;
  /** The middle of a row that means inside, as shares of it. Default 25% to 75%. */
  nestRange?: SortableNestRange;
  /** The element of an item that has the focus (a button in a row). Default: the item itself. */
  focusSelector?: string;
  /** A drag type of its own, carrying the id, in place of the item's text. */
  dragType?: string;
}

/** Where the pointer would drop, and on which item. */
export interface SortableOver {
  id: string;
  position: SortablePosition;
}

/** What an item shows of the drag: held, or under the pointer. */
export interface SortableItemState {
  dragging: boolean;
  /** Set on the item under the pointer, never on the one held. */
  over: SortablePosition | null;
}

type Handlers = HTMLAttributes<HTMLElement>;

export interface SortableApi {
  /** Ref of the list element (a callback, so any element type takes it). */
  listRef: (element: HTMLElement | null) => void;
  /** The id being dragged. */
  dragging: string | null;
  over: SortableOver | null;
  /** The last announcement, for the live region. */
  status: string;
  /** Says something in the live region: a removal, an insertion. */
  announce: (text: string) => void;
  /** Moves an item to an index (kept in `range`), as the keyboard does; the focus follows unless `focus: false`. False when nothing moved. */
  moveTo: (id: string, to: number, options?: { focus?: boolean }) => boolean;
  /** Focuses an item, or its `focusSelector`. */
  focusItem: (id: string) => void;
  /** The list's props: `aria-label` and the ref. */
  getListProps: <P extends object = object>(
    rest?: P,
  ) => P & { ref: (element: HTMLElement | null) => void; "aria-label"?: string };
  /** The item's props, yours merged: your handler runs first and can `preventDefault()` to skip ours. */
  getItemProps: <P extends Handlers = Handlers>(id: string, rest?: P) => P;
  /** The handle's props: draggable. */
  getHandleProps: <P extends Handlers = Handlers>(id: string, rest?: P) => P;
  getItemState: (id: string) => SortableItemState;
}

const chain =
  <E extends { defaultPrevented: boolean }>(
    theirs: ((event: E) => void) | undefined,
    ours: (event: E) => void,
  ) =>
  (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };

/**
 * The state and the props getters of a reorderable list. Spread `getListProps()` on the list,
 * `getItemProps(id, yours)` on each item and `getHandleProps(id)` on a handle; hold the order
 * yourself and take the new one from `onReorder`.
 */
export function useSortable<T>(options: UseSortableOptions<T>): SortableApi {
  const {
    items,
    getId,
    onReorder,
    onItemDrop,
    orientation = "vertical",
    label,
    getLabel,
    announce: announceMove,
    disabled,
    handle = false,
    drag = true,
    keyboard = true,
    navigate = false,
    homeEnd = false,
    range,
    canDrop,
    pointer = Boolean(onItemDrop) || Boolean(options.nest),
    nest,
    nestRange,
    focusSelector,
    dragType,
  } = options;
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<SortableOver | null>(null);
  const [status, setStatus] = useState("");
  const root = useRef<HTMLElement | null>(null);
  const focusId = useRef<string | null>(null);
  const listRef = useCallback((element: HTMLElement | null) => {
    root.current = element;
  }, []);

  const ids = items.map(getId);
  const count = ids.length;
  const locked = (id: string) =>
    typeof disabled === "function" ? disabled(id) : Boolean(disabled);
  const nameOf = (id: string) => {
    const item = items[ids.indexOf(id)];
    return item !== undefined && getLabel ? getLabel(item) : id;
  };

  const find = (id: string) =>
    Array.from(root.current?.querySelectorAll<HTMLElement>("[data-sortable-id]") ?? []).find(
      (el) => el.dataset.sortableId === id,
    ) ?? null;

  const focusItem = (id: string) => {
    const el = find(id);
    if (!el) return;
    (focusSelector ? el.querySelector<HTMLElement>(focusSelector) : null)?.focus();
    if (!focusSelector) el.focus();
  };

  // After a move, the focus follows the item.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    focusItem(id);
  });

  const moveTo = (id: string, to: number, keepFocus = true) => {
    const from = ids.indexOf(id);
    if (from < 0) return false;
    const target = clampIndex(to, count, range);
    if (target === from) return false;
    const move: SortableMove = { id, from, to: target };
    onReorder?.(moveItem(items, from, target), move);
    const said = announceMove
      ? announceMove(move, items[from] as T, count)
      : sortableAnnouncement(nameOf(id), move, count);
    if (said !== null) setStatus(said);
    if (keepFocus) focusId.current = id;
    return true;
  };

  const reset = () => {
    setDragging(null);
    setOver(null);
  };

  const positionOf = (id: string, event: DragEvent<HTMLElement>): SortablePosition => {
    if (!pointer) return ids.indexOf(dragging ?? "") < ids.indexOf(id) ? "after" : "before";
    const box = event.currentTarget.getBoundingClientRect();
    const horizontal = orientation === "horizontal";
    const offset = horizontal ? event.clientX - box.left : event.clientY - box.top;
    const size = horizontal ? box.width : box.height;
    const inside = nest?.(id) ?? false;
    return sortableDropPosition(offset, size, inside && (nestRange ?? true));
  };

  const onKeyDown = (id: string, event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && !(focusSelector && target.matches(focusSelector))) return;
    const step = sortableKeyStep(event.key, orientation, homeEnd);
    if (!step) return;
    const at = ids.indexOf(id);
    if (event.altKey) {
      if (!keyboard || locked(id)) return;
      event.preventDefault();
      moveTo(id, sortableStepTarget(step, at, count));
      return;
    }
    if (!navigate || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    const next = ids[sortableStepTarget(step, at, count)];
    if (next !== undefined) focusItem(next);
  };

  const onDragStart = (id: string, event: DragEvent<HTMLElement>) => {
    // With a handle, only a drag that starts on it carries the item.
    if (handle && !(event.target as HTMLElement).closest?.("[data-sortable-handle]")) return;
    if (locked(id)) return event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(dragType ?? "text/plain", dragType ? id : nameOf(id));
    setDragging(id);
  };

  const onDragOver = (id: string, event: DragEvent<HTMLElement>) => {
    if (dragging === null) return;
    const position = positionOf(id, event);
    if (canDrop && !canDrop(dragging, id, position)) {
      if (over) setOver(null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (over?.id !== id || over.position !== position) setOver({ id, position });
  };

  const onDragLeave = (id: string, event: DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    if (over?.id === id) setOver(null);
  };

  const onDragDrop = (id: string, event: DragEvent<HTMLElement>) => {
    if (dragging === null) return;
    const held = dragging;
    const position = positionOf(id, event);
    event.preventDefault();
    event.stopPropagation();
    reset();
    if (canDrop && !canDrop(held, id, position)) return;
    if (onItemDrop) return onItemDrop({ id: held, overId: id, position });
    const slot = ids.indexOf(id) + (pointer && position === "after" ? 1 : 0);
    moveTo(held, pointer ? sortableSlotIndex(ids.indexOf(held), slot) : ids.indexOf(id), false);
  };

  const getItemState = (id: string): SortableItemState => ({
    dragging: dragging === id,
    over: over?.id === id && dragging !== id ? over.position : null,
  });

  return {
    listRef,
    dragging,
    over,
    status,
    announce: setStatus,
    moveTo: (id, to, options) => moveTo(id, to, options?.focus ?? true),
    focusItem,
    getListProps: (rest) =>
      ({
        ...rest,
        ref: listRef,
        ...(label ? { "aria-label": label } : {}),
      }) as never,
    getItemProps: (id, rest) => {
      const state = getItemState(id);
      const theirs = (rest ?? {}) as Handlers;
      return {
        ...theirs,
        "data-sortable-id": id,
        "data-dragging": state.dragging ? "" : undefined,
        "data-over": state.over ?? undefined,
        ...(drag && !handle ? { draggable: !locked(id) } : {}),
        ...(keyboard || navigate
          ? { onKeyDown: chain(theirs.onKeyDown, (e) => onKeyDown(id, e)) }
          : {}),
        ...(drag
          ? {
              onDragStart: chain(theirs.onDragStart, (e) => onDragStart(id, e)),
              onDragEnd: chain(theirs.onDragEnd, reset),
              onDragOver: chain(theirs.onDragOver, (e) => onDragOver(id, e)),
              onDragLeave: chain(theirs.onDragLeave, (e) => onDragLeave(id, e)),
              onDrop: chain(theirs.onDrop, (e) => onDragDrop(id, e)),
            }
          : {}),
      } as never;
    },
    getHandleProps: (id, rest) =>
      ({
        ...rest,
        "data-sortable-handle": "",
        "aria-hidden": "true",
        draggable: drag && !locked(id),
      }) as never,
    getItemState,
  };
}

/* ------------------------------------------------------------------------ the parts */

const SortableContext = createContext<SortableApi | null>(null);
const SortableItemContext = createContext<string | null>(null);

/** The state of the enclosing `Sortable`, for a part of your own. */
export function useSortableContext(): SortableApi {
  const api = use(SortableContext);
  if (!api) throw new Error("Sortable parts go inside a <Sortable>.");
  return api;
}

type Part<T> = Omit<T, "className"> & { className?: string };

const defaultGetId = (item: unknown) =>
  String((item as { id?: unknown } | null)?.id ?? (item as string));

export interface SortableProps<T = unknown>
  extends
    Part<Omit<ComponentProps<"ul">, "ref" | "children">>,
    Omit<UseSortableOptions<T>, "items" | "getId" | "onReorder" | "label"> {
  /** The items in order, controlled. */
  items?: ReadonlyArray<T>;
  /** The items, when the list owns the order. */
  defaultItems?: ReadonlyArray<T>;
  /** Default: the item's `id`. */
  getId?: (item: T) => string;
  /** The new order, after a keyboard move or a drop (also when the list owns it). */
  onReorder?: (next: T[], move: SortableMove) => void;
  /** Names the list for assistive technology. */
  label?: string;
  /** A live region after the list that says each move. Default `true`. */
  status?: boolean;
  /** One `SortableItem` per item, or a function from an item to it. */
  children?: ReactNode | ((item: T, index: number) => ReactNode);
  /** Draws another element in place of the `ul`. */
  render?: ReactElement;
  ref?: Ref<HTMLElement>;
}

/** The list: it holds the drag and keyboard state of its `SortableItem`s. */
export function Sortable<T = unknown>({
  items: itemsProp,
  defaultItems,
  getId = defaultGetId as (item: T) => string,
  onReorder,
  onItemDrop,
  orientation = "vertical",
  label,
  getLabel,
  announce,
  disabled,
  handle,
  drag,
  keyboard,
  navigate,
  homeEnd,
  range,
  canDrop,
  pointer,
  nest,
  nestRange,
  focusSelector,
  dragType,
  status = true,
  children,
  render,
  className,
  ref,
  ...rest
}: SortableProps<T>) {
  const [items, setItems] = useControllableState<ReadonlyArray<T>>({
    value: itemsProp,
    defaultValue: defaultItems ?? [],
  });
  const api = useSortable<T>({
    items,
    getId,
    onReorder: (next, move) => {
      setItems(next);
      onReorder?.(next, move);
    },
    onItemDrop,
    orientation,
    label,
    getLabel,
    announce,
    disabled,
    handle,
    drag,
    keyboard,
    navigate,
    homeEnd,
    range,
    canDrop,
    pointer,
    nest,
    nestRange,
    focusSelector,
    dragType,
  });
  const element = useRender({
    defaultTagName: "ul",
    render,
    ref: ref ? [ref, api.listRef] : api.listRef,
    props: {
      "data-slot": "sortable",
      ...api.getListProps(rest),
      "data-orientation": orientation,
      className: cx("fg-sortable", className),
      children:
        typeof children === "function"
          ? items.map((item, i) => <Fragment key={getId(item)}>{children(item, i)}</Fragment>)
          : children,
    },
  });
  return (
    <SortableContext value={api}>
      {element}
      {status ? <SortableStatus /> : null}
    </SortableContext>
  );
}

export interface SortableItemProps extends Part<ComponentProps<"li">> {
  /** The item's id, as `getId` gives it. */
  id: string;
  /** Draws another element in place of the `li`. */
  render?: ReactElement;
}

/** One item: draggable, moved with Alt + arrows, marked while held or under the pointer. */
export function SortableItem({ id, render, className, children, ref, ...rest }: SortableItemProps) {
  const api = useSortableContext();
  const element = useRender({
    defaultTagName: "li",
    render,
    ref,
    props: {
      tabIndex: 0,
      "data-slot": "sortable-item",
      ...api.getItemProps(id, rest),
      className: cx("fg-sortable-item", className),
      children,
    },
  });
  return <SortableItemContext value={id}>{element}</SortableItemContext>;
}

export interface SortableHandleProps extends Part<ComponentProps<"span">> {
  /** Draws another element in place of the `span`. */
  render?: ReactElement;
}

/**
 * The grip an item is dragged by (give `handle` to the list). Hidden from assistive technology:
 * the keyboard moves the item itself. Outside a `Sortable`, it is a plain span with your props.
 */
export function SortableHandle({ render, className, children, ref, ...rest }: SortableHandleProps) {
  const api = use(SortableContext);
  const id = use(SortableItemContext);
  const element = useRender({
    defaultTagName: "span",
    render,
    ref,
    props: {
      "aria-hidden": true,
      "data-slot": "sortable-handle",
      ...(api && id !== null ? api.getHandleProps(id, rest) : rest),
      className: cx("fg-sortable-handle", className),
      children: children ?? <Icon icon={GripIcon} size={12} variant="mono" />,
    },
  });
  return element;
}

export interface SortableDropIndicatorProps extends Part<ComponentProps<"span">> {
  /** Draws another element in place of the `span`. */
  render?: ReactElement;
}

/** The line where a drop would land, drawn in the item under the pointer (before, after, inside). */
export function SortableDropIndicator({
  render,
  className,
  ref,
  ...rest
}: SortableDropIndicatorProps) {
  const api = useSortableContext();
  const id = use(SortableItemContext);
  const position = id === null ? null : api.getItemState(id).over;
  const element = useRender({
    defaultTagName: "span",
    render,
    ref,
    props: {
      "aria-hidden": true,
      "data-position": position ?? undefined,
      "data-slot": "sortable-drop-indicator",
      ...rest,
      className: cx("fg-sortable-indicator", className),
    },
  });
  return position ? element : null;
}

export interface SortableStatusProps extends Part<ComponentProps<"span">> {
  /** What to say, in place of the list's last move. */
  text?: string;
}

/** The live region that says each move: "Moved Status to position 3 of 5". */
export function SortableStatus({ text, className, ...rest }: SortableStatusProps) {
  const api = use(SortableContext);
  return (
    <span
      role="status"
      aria-live="polite"
      data-slot="sortable-status"
      {...rest}
      className={cx("fg-sr", className)}
    >
      {text ?? api?.status}
    </span>
  );
}
