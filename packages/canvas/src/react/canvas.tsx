// <Canvas>: the infinite surface. It turns pointer, wheel and key events into engine commands and
// queries (pan, zoom, select, box and lasso, move, resize, connect, nudge), hands a `Scene` to a
// renderer for the primitives (grid, shapes, selection), and renders rich items in a DOM overlay
// through `renderItem`. It only talks to the store's engine interface, never to its internals.

import { matchShortcut, useShortcuts } from "@forgeron/ui";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { rectFromPoints } from "../core/geometry";
import { snapPoint } from "../core/grid";
import { handlePosition, type BoxMode, type Direction } from "../core/hit";
import { CANVAS_KEYMAP, DEFAULT_NUDGE, runCommand, type NudgeSteps } from "../core/keymap";
import type { CanvasState } from "../core/engine";
import type { FarPrimitive } from "../core/far";
import type { FarGroup } from "../core/far-buffer";
import type { CanvasStore } from "../core/store";
import {
  gestureFor,
  isDrag,
  PAN_TOOL,
  type CanvasTool,
  type PressTarget,
  type ToolGesture,
} from "../core/tools";
import type {
  Bounds,
  CanvasPointer,
  ConnectionEnd,
  Handle,
  Item,
  Modifiers,
  Point,
  Viewport,
} from "../core/types";
import { boundsToScreen, screenToWorld, visibleWorld, wheelZoomFactor } from "../core/viewport";
import { CanvasProvider, useCanvasState, useCullWindow } from "./context";
import { createFarLayer, type FarLayer, type FarLayerName } from "./far-layer";
import { createDomRenderer, type CanvasRenderer, type Primitive, type Scene } from "./renderer";

/** What a consumer tool gets with each press. */
export interface CanvasToolApi<D = unknown> {
  store: CanvasStore<D>;
  /** The point on the grid, unless snapping is off or Alt is held. */
  snap: (point: Point, modifiers?: Partial<Modifiers>) => Point;
}

export interface RenderItemState {
  selected: boolean;
  /**
   * The canvas is in its far view (`far.zoom`): the item is in the DOM only because its kind has
   * no far drawing, it is focused, or the consumer keeps it (`far.keep`). Draw it as seen from far.
   */
  far: boolean;
}

/** How an item of a kind looks from far: primitives in world units, none for nothing. */
export type FarDraw<D> = (
  item: Item<D>,
  /**
   * `kept`: the item is in `far.keep`, its DOM shows what it holds (a field being typed). `shown`:
   * the DOM holds the item now (with `overlay`, its body over this drawing: flow's card near).
   */
  state: { selected: boolean; kept: boolean; shown: boolean },
) => ReadonlyArray<FarPrimitive> | null;

/**
 * The far view: below `zoom`, the items whose kind has a far drawing are drawn as primitives on one
 * GPU surface (WebGL2; a 2D canvas without it) instead of the DOM. Hit testing stays the engine's.
 * With `overlay`, the GPU draws them at every zoom, and the DOM holds only what it must show.
 */
export interface CanvasFar<D> {
  /** Under this zoom the far view is on; 0 turns it off. */
  zoom: number;
  /** Per kind, its far drawing; a kind without one stays in the DOM. */
  kinds: Readonly<Record<string, FarDraw<D>>>;
  /**
   * Primitives that are not items, under them (flow's edges), in world units; drawn whenever given,
   * in the far view or not: the consumer gives them while its own DOM is not there. As groups
   * (an edge each), only the groups that change are packed again.
   */
  below?: ReadonlyArray<FarPrimitive> | ReadonlyArray<FarGroup>;
  /** Items kept in the DOM in the far view too (one being edited, the ends of an arrow). */
  keep?: ReadonlyArray<string>;
  /**
   * The GPU draws the kinds at every zoom, the selection's outlines, its handles, the box and the
   * lasso too. Above `zoom`, the DOM holds only the items in the cull window for which this says
   * yes (their text, over the GPU drawing), the focused one and those kept; below it, as in the
   * far view. `renderItem` then draws only what the GPU does not.
   */
  overlay?: (item: Item<D>) => boolean;
  /**
   * With `overlay`: above `zoom`, the selection's outlines, its handles, the box and the lasso are
   * drawn over the DOM, as without the GPU (flow's cards are DOM near, and cover the GPU layer);
   * below it, on the GPU.
   */
  chromeOverDom?: boolean;
  /**
   * An item's drawing moved by whole world units is its drawing moved by as much, given the same
   * data, size and flags (and `depends` moved by as much): the far layer then moves it by an
   * offset without asking `kinds` again (a drag of thousands). Off by default.
   */
  moves?: boolean;
  /**
   * A box an item's drawing depends on besides the item (the frame that clips it), or undefined.
   * Read for every item at each change; asked again when it changes, moved with the item when it
   * moved by as much. Lets `kinds` stay the same function when that box changes.
   */
  depends?: (item: Item<D>) => Bounds | undefined;
}

/** An option of the offscreen list that is not an item (an edge between two nodes). */
export interface CanvasListEntry {
  /** Unique among the entries. */
  id: string;
  /** Its name for assistive technology: "Edge from Order to Invoice". */
  label: string;
  /** What it is (`aria-roledescription`): "edge". */
  role?: string;
  selected?: boolean;
  /** Where it reads in the list, world units (its middle). */
  at: Point;
  /** The surface's active descendant when no item is (the selected edge). */
  active?: boolean;
}

export interface CanvasProps<D = unknown> {
  store: CanvasStore<D>;
  /**
   * The DOM overlay of an item: text, fields, rich content, inside the item's positioned box.
   * Return null for an item drawn by its primitive alone.
   */
  renderItem: (item: Item<D>, state: RenderItemState) => ReactNode;
  /** The shape the renderer draws under the overlay; none by default. */
  primitive?: (item: Item<D>) => Primitive | null;
  /** The far view: items drawn as primitives on the GPU below a zoom, instead of the DOM. */
  far?: CanvasFar<D>;
  /** Draws the primitives; the DOM and SVG renderer by default. */
  renderer?: () => CanvasRenderer;
  /** Names the surface for assistive technology, e.g. "Flow editor". */
  label: string;
  /** Names an item for assistive technology; `<kind> <id>` by default. Give it the item's words. */
  itemLabel?: (item: Item<D>) => string;
  /** What an item is, for assistive technology (`aria-roledescription`): "sticky note", "step". */
  itemRole?: (item: Item<D>) => string;
  /**
   * More options of the offscreen list, for what is drawn but is not an item (flow's edges): in
   * reading order with the items, named and described the same way; at most 200, the nearest
   * the view's centre. Give those in the cull window.
   */
  listEntries?: ReadonlyArray<CanvasListEntry>;
  /** Consumer tools, picked with `store.setTool(id)`; `select` and `pan` are built in. */
  tools?: ReadonlyArray<CanvasTool<CanvasToolApi<D>>>;
  /** React layers in world space below and above the items: edges, guides, a drop preview. */
  layers?: { below?: ReactNode; above?: ReactNode };
  /** Drawn in screen space over the surface: zoom controls, minimap, toolbars. */
  children?: ReactNode;
  /**
   * The canvas keys (nudge, delete, undo, zoom…): `focus` (default) while the surface or an item
   * has the focus; `page` also from anywhere on the page (one editor per page); `false` none.
   */
  keyboard?: "focus" | "page" | false;
  nudge?: NudgeSteps;
  /** The wheel pans (default; Command or Control, and a pinch, zoom) or zooms. */
  wheel?: "pan" | "zoom";
  /** A box selects what it touches (default) or what it wholly contains. */
  boxMode?: BoxMode;
  /** Draws the 1 px accent outline and the resize handles of the selection; on by default. */
  selectionChrome?: boolean;
  /**
   * Screen pixels around the view whose items are still rendered; 256 by default. Up to twice as
   * many are: the rendered window moves only when the view comes within this margin of its edge.
   */
  overscan?: number;
  /** A connect gesture started on a `data-canvas-handle` ends: over an item, a handle, or nothing. */
  onConnect?: (from: ConnectionEnd, to: ConnectionEnd | null, point: Point) => void;
  /** Whether the pointer may end a connection there; anything but the start item by default. */
  canConnect?: (from: ConnectionEnd, to: ConnectionEnd) => boolean;
  /** Double click or Enter on an item: open it, edit its text. */
  onItemActivate?: (item: Item<D>) => void;
  /** Double click on the empty surface, in world units: add something there. */
  onSurfaceDoubleClick?: (point: Point) => void;
  /** Right click: on an item (selected first) or on the surface. */
  onContextMenu?: (item: Item<D> | null, point: Point, event: ReactMouseEvent) => void;
  className?: string;
  style?: CSSProperties;
}

type Active =
  | { type: "pan"; start: Point; from: Viewport; moved: boolean; clears: boolean }
  | {
      type: "move";
      id: string;
      toggle: boolean;
      start: Point;
      anchor: Bounds;
      moving: Array<readonly [string, Bounds]>;
      moved: boolean;
    }
  | { type: "resize"; id: string; handle: Handle; start: Point; from: Bounds }
  | { type: "box"; start: Point; base: ReadonlySet<string>; additive: boolean; moved: boolean }
  | { type: "lasso"; points: Point[]; base: ReadonlySet<string>; additive: boolean; moved: boolean }
  | { type: "connect"; from: ConnectionEnd }
  | { type: "tool"; gesture: ToolGesture };

const FIELD =
  "input, textarea, select, button, a[href], [contenteditable=''], [contenteditable='true'], [data-canvas-interactive]";
const isField = (target: EventTarget | null) =>
  target instanceof Element && target.closest(FIELD) !== null;

const CURSORS: Record<Handle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};
const ARROWS: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};
/** Screen pixels around a handle that still grab it. */
const HANDLE_REACH = 6;

const cssEscape = (id: string) =>
  typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, "\\$&");
const defaultLabel = (item: Item<unknown>) => `${item.kind} ${item.id}`;
const NO_PRIMITIVES: Scene["primitives"] = [];
const selectItems = <D,>(s: CanvasState<D>) => s.items;
const selectSelection = <D,>(s: CanvasState<D>) => s.selection;
const selectTool = <D,>(s: CanvasState<D>) => s.tool;
const worldTransform = (v: Viewport) => `translate(${v.x}px, ${v.y}px) scale(${v.zoom})`;

interface ItemViewProps<D> {
  item: Item<D>;
  selected: boolean;
  far: boolean;
  /** An option of the items' listbox; not when the offscreen list holds the options. */
  option: boolean;
  tabbable: boolean;
  label: string;
  render: (item: Item<D>, state: RenderItemState) => ReactNode;
  onFocus: (id: string) => void;
}

function ItemViewInner<D>({
  item,
  selected,
  far,
  option,
  tabbable,
  label,
  render,
  onFocus,
}: ItemViewProps<D>) {
  const b = item.bounds;
  return (
    <div
      className="fg-canvas-item"
      data-canvas-item={item.id}
      data-kind={item.kind}
      data-selected={selected || undefined}
      data-locked={item.locked || undefined}
      role={option ? "option" : undefined}
      aria-selected={option ? selected : undefined}
      aria-label={label}
      tabIndex={option ? (tabbable ? 0 : -1) : undefined}
      onFocus={(e) => {
        if (e.target === e.currentTarget) onFocus(item.id);
      }}
      style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
    >
      {render(item, { selected, far })}
    </div>
  );
}
const ItemView = memo(ItemViewInner) as typeof ItemViewInner;

/** An option of the offscreen list: rendered again when what it says changes, not as items move. */
const A11yOption = memo(function A11yOption({
  id,
  item,
  entry,
  selected,
  role,
  label,
}: {
  id: string;
  /** The item it stands for, or the consumer's entry. */
  item?: string;
  entry?: string;
  selected: boolean;
  role: string | undefined;
  label: string;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      aria-roledescription={role}
      aria-label={label}
      data-item={item}
      data-entry={entry}
    >
      {label}
    </div>
  );
});

/**
 * Items mounted per frame while the DOM catches up after a far/near switch: adapted to how long the
 * last step took, so a step stays near `STEP_BUDGET` ms on any machine. Unmounting is cheaper.
 */
const FIRST_MOUNTS = 16;
const STEP_BUDGET = 6;
const UNMOUNTS_PER_MOUNT = 4;
/**
 * Options of the offscreen list at most: the items of the cull window nearest the view's centre,
 * plus the focused one and a few selected ones out of it.
 */
const A11Y_LIMIT = 200;
const A11Y_SELECTED_OUT = 20;
const NO_FAR: ReadonlyArray<FarPrimitive> = [];

/** `b` is `a` moved by `(dx, dy)`, or both are missing. */
const sameBox = (a: Bounds | undefined, b: Bounds | undefined, dx: number, dy: number) =>
  a === b || (!!a && !!b && b.x - a.x === dx && b.y - a.y === dy && a.w === b.w && a.h === b.h);

/** `now` is `was` moved by whole units, the same otherwise, and what it depends on moved too. */
function movedWhole<D>(
  was: Item<D>,
  now: Item<D>,
  wasDep: Bounds | undefined,
  dep: Bounds | undefined,
): boolean {
  const dx = now.bounds.x - was.bounds.x;
  const dy = now.bounds.y - was.bounds.y;
  return (
    Number.isInteger(dx) &&
    Number.isInteger(dy) &&
    now.kind === was.kind &&
    now.data === was.data &&
    now.locked === was.locked &&
    now.bounds.w === was.bounds.w &&
    now.bounds.h === was.bounds.h &&
    sameBox(wasDep, dep, dx, dy)
  );
}

/**
 * The `A11Y_LIMIT` entries nearest `c`, in their order: the distance of the last one taken found
 * by selection (no sort of thousands, no object per entry), ties broken by order.
 */
function nearest(entries: ReadonlyArray<CanvasListEntry>, c: Point): CanvasListEntry[] {
  const d = new Float64Array(entries.length);
  for (let i = 0; i < entries.length; i++) {
    const dx = entries[i]!.at.x - c.x;
    const dy = entries[i]!.at.y - c.y;
    d[i] = dx * dx + dy * dy;
  }
  // The k-th smallest distance (quickselect on a copy).
  const a = d.slice();
  const k = A11Y_LIMIT - 1;
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const pivot = a[(lo + hi) >> 1]!;
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (a[i]! < pivot) i++;
      while (a[j]! > pivot) j--;
      if (i <= j) {
        const t = a[i]!;
        a[i] = a[j]!;
        a[j] = t;
        i++;
        j--;
      }
    }
    if (k <= j) hi = j;
    else if (k >= i) lo = i;
    else break;
  }
  const limit = a[k]!;
  const out: CanvasListEntry[] = [];
  for (let i = 0; i < entries.length && out.length < A11Y_LIMIT; i++) {
    if (d[i]! < limit) out.push(entries[i]!);
  }
  for (let i = 0; i < entries.length && out.length < A11Y_LIMIT; i++) {
    if (d[i] === limit) out.push(entries[i]!);
  }
  return out;
}

/** The screen boxes that meet the surface (a pixel of margin for the outline's own stroke). */
const onScreen = (boxes: Bounds[], size: { w: number; h: number }) =>
  !size.w || !size.h
    ? boxes
    : boxes.filter(
        (b) => b.x + b.w >= -2 && b.y + b.h >= -2 && b.x <= size.w + 2 && b.y <= size.h + 2,
      );
const NO_GROUPS: ReadonlyArray<FarGroup> = [];

/** Each selected item's outline as drawn first, per store: moved after by its group's offset. */
type Outlines = Map<
  string,
  { x: number; y: number; w: number; h: number; prims: FarGroup["prims"] }
>;
const outlineCache = new WeakMap<object, Outlines>();
function outlinesOf(store: object): Outlines {
  let m = outlineCache.get(store);
  if (!m) outlineCache.set(store, (m = new Map()));
  return m;
}
const nextFrame = (f: () => void): (() => void) => {
  if (typeof requestAnimationFrame === "function") {
    const id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(f, 16);
  return () => clearTimeout(id);
};

/**
 * What the DOM holds: the items in the cull window, plus the selected and the focused ones; in the
 * far view, only those whose kind has no far drawing, the focused one and those the consumer keeps.
 */
function domTarget<D>(
  s: {
    store: CanvasStore<D>;
    items: ReadonlyArray<Item<D>>;
    culled: ReadonlyArray<Item<D>>;
    selection: ReadonlySet<string>;
    liveFocus: string | null;
    farKinds: CanvasFar<D>["kinds"] | undefined;
    keepKey: string;
    overlay: CanvasFar<D>["overlay"];
  },
  farView: boolean,
): ReadonlyArray<Item<D>> {
  const { farKinds, overlay } = s;
  const base =
    farView && farKinds
      ? s.culled.filter((i) => farKinds[i.kind] === undefined)
      : overlay && farKinds
        ? s.culled.filter((i) => farKinds[i.kind] === undefined || overlay(i))
        : s.culled;
  const extra =
    farView || (overlay && farKinds) ? (s.keepKey ? s.keepKey.split("\n") : []) : [...s.selection];
  if (s.liveFocus) extra.push(s.liveFocus);
  const ids = new Set(base.map((i) => i.id));
  const missing = extra.filter((id) => !ids.has(id) && s.store.get(id));
  if (missing.length === 0) return base;
  // An off-screen selected or focused item: keep the document's order.
  for (const id of missing) ids.add(id);
  return s.items.filter((i) => ids.has(i.id));
}

/**
 * One step of the DOM towards `want`: keeps what is wanted, mounts and unmounts a few more. Null
 * once it is there.
 */
function stepMounted(
  mounted: ReadonlySet<string>,
  want: ReadonlyArray<{ id: string }>,
  mounts: number,
): ReadonlySet<string> | null {
  const wanted = new Set(want.map((i) => i.id));
  const next = new Set<string>();
  let removed = 0;
  let added = 0;
  let done = true;
  for (const id of mounted) {
    if (wanted.has(id)) next.add(id);
    else if (removed < mounts * UNMOUNTS_PER_MOUNT) removed++;
    else {
      next.add(id);
      done = false;
    }
  }
  for (const id of wanted) {
    if (next.has(id)) continue;
    if (added < mounts) {
      next.add(id);
      added++;
    } else done = false;
  }
  return done ? null : next;
}

export function Canvas<D = unknown>({
  store,
  renderItem,
  primitive,
  far,
  renderer: makeRenderer = createDomRenderer,
  label,
  itemLabel = defaultLabel,
  itemRole,
  listEntries,
  tools = [],
  layers,
  children,
  keyboard = "focus",
  nudge = DEFAULT_NUDGE,
  wheel = "pan",
  boxMode = "intersect",
  selectionChrome = true,
  overscan = 256,
  onConnect,
  canConnect,
  onItemActivate,
  onSurfaceDoubleClick,
  onContextMenu,
  className,
  style,
}: CanvasProps<D>) {
  // Narrow slices: the camera is not among them. A pan or a zoom moves the world layer and redraws
  // the renderer from a store listener (below), and re-renders this component only when the cull
  // window moves.
  const items = useCanvasState(store, selectItems);
  const selection = useCanvasState(store, selectSelection);
  const tool = useCanvasState(store, selectTool);
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const farRef = useRef<FarLayer | null>(null);
  // What each layer of the far layer was last given.
  const farSet = useRef<
    Partial<Record<FarLayerName, ReadonlyArray<FarPrimitive> | ReadonlyArray<FarGroup>>>
  >({});
  const active = useRef<Active | null>(null);
  const space = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [hoverCursor, setHoverCursor] = useState<string | null>(null);
  const [band, setBand] = useState<Bounds | null>(null);
  const [lasso, setLasso] = useState<Point[] | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  // Read by the key and focus handlers: the offscreen list is on, the item it has active.
  const listMode = useRef(false);
  const focusRef = useRef<string | null>(null);
  const uid = useId();
  const [announcement, setAnnouncement] = useState("");
  const wheelMode = useRef(wheel);
  useEffect(() => {
    wheelMode.current = wheel;
  }, [wheel]);
  const readOnly = store.readOnly;

  const api = useMemo<CanvasToolApi<D>>(
    () => ({
      store,
      snap: (p, mods) => (store.grid.snap && !mods?.alt ? snapPoint(p, store.grid.size) : p),
    }),
    [store],
  );

  /* ---- renderer */

  useLayoutEffect(() => {
    const r = makeRenderer();
    r.mount({ under: underRef.current!, over: overRef.current! });
    rendererRef.current = r;
    return () => {
      r.unmount();
      rendererRef.current = null;
    };
  }, [makeRenderer]);

  // The far layer exists while the canvas has a far view; it sits above the grid, under the items.
  const farZoom = far && far.zoom > 0 ? far.zoom : 0;
  const hasFarView = farZoom > 0;
  useLayoutEffect(() => {
    if (!hasFarView) return;
    const layer = createFarLayer(underRef.current!);
    farRef.current = layer;
    farSet.current = {};
    return () => {
      layer.destroy();
      farRef.current = null;
    };
  }, [hasFarView]);

  /* ---- size and wheel */

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      store.setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [store]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-canvas-overlay]")) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const anchor = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (e.ctrlKey || e.metaKey || wheelMode.current === "zoom") {
        const pinch = e.ctrlKey && Math.abs(e.deltaY) < 50;
        store.zoomTo(store.getState().viewport.zoom * wheelZoomFactor(e.deltaY, pinch), anchor);
        return;
      }
      const sideways = e.shiftKey && !e.deltaX;
      store.panBy(-(sideways ? e.deltaY : e.deltaX), -(sideways ? 0 : e.deltaY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [store]);

  /* ---- pointer */

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const pointer = (e: ReactPointerEvent): CanvasPointer => {
    const screen = local(e);
    return {
      screen,
      world: screenToWorld(store.getState().viewport, screen),
      button: e.button,
      pointerId: e.pointerId,
      shift: e.shiftKey,
      alt: e.altKey,
      mod: e.metaKey || e.ctrlKey,
    };
  };
  const handleAt = (world: Point) =>
    selectionChrome
      ? store.query({
          type: "handle-at",
          point: world,
          tolerance: HANDLE_REACH / store.getState().viewport.zoom,
        })
      : null;

  const targetOf = (el: Element, world: Point): PressTarget => {
    const grip = handleAt(world);
    if (grip) return { type: "resize", itemId: grip.itemId, handle: grip.handle };
    const handle = el.closest<HTMLElement>("[data-canvas-handle]");
    const owner = handle?.closest<HTMLElement>("[data-canvas-item]");
    if (handle && owner?.dataset.canvasItem) {
      return {
        type: "connect",
        itemId: owner.dataset.canvasItem,
        handle: handle.dataset.canvasHandle ?? "",
      };
    }
    const hit = store.query({ type: "hit", point: world });
    return hit ? { type: "item", itemId: hit.id } : { type: "empty" };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.target as Element;
    if (el.closest("[data-canvas-overlay]") || isField(el)) return;
    const root = rootRef.current!;
    // Focus follows the pointer, without the keyboard ring (data-pointer, cleared by a key).
    root.dataset.pointer = "";
    if (document.activeElement !== root) root.focus({ preventScroll: true });
    const p = pointer(e);
    const s = store.getState();
    const target = targetOf(el, p.world);
    const g = gestureFor({ tool: s.tool, pointer: p, spaceHeld: space.current, target, readOnly });
    switch (g.type) {
      case "none":
        return;
      case "pan":
        active.current = {
          type: "pan",
          start: p.screen,
          from: s.viewport,
          moved: false,
          clears: target.type === "empty" && s.tool === PAN_TOOL,
        };
        setPanning(true);
        break;
      case "press-item": {
        if (g.toggle) store.select([g.itemId], "toggle");
        else if (!s.selection.has(g.itemId)) store.select([g.itemId]);
        const ids = store.query({ type: "movable", ids: [...store.getState().selection] });
        active.current = {
          type: "move",
          id: g.itemId,
          toggle: g.toggle,
          start: p.screen,
          anchor: store.get(g.itemId)!.bounds,
          moving: ids.map((id) => [id, store.get(id)!.bounds] as const),
          moved: false,
        };
        break;
      }
      case "resize": {
        const item = store.get(g.itemId);
        if (!item) return;
        store.beginGesture("Resize");
        active.current = {
          type: "resize",
          id: item.id,
          handle: g.handle,
          start: p.screen,
          from: item.bounds,
        };
        break;
      }
      case "box":
      case "lasso":
        active.current =
          g.type === "box"
            ? {
                type: "box",
                start: p.screen,
                base: g.additive ? s.selection : new Set(),
                additive: g.additive,
                moved: false,
              }
            : {
                type: "lasso",
                points: [p.screen],
                base: g.additive ? s.selection : new Set(),
                additive: g.additive,
                moved: false,
              };
        break;
      case "connect": {
        const from: ConnectionEnd = { itemId: g.itemId, handle: g.handle };
        store.setConnection({ from, point: p.world, over: null });
        active.current = { type: "connect", from };
        break;
      }
      case "tool": {
        const gesture = tools.find((t) => t.id === g.tool)?.down?.(p, api);
        if (!gesture) return;
        active.current = { type: "tool", gesture };
        break;
      }
    }
    e.preventDefault();
    root.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = active.current;
    const p = pointer(e);
    if (!a) {
      const grip = handleAt(p.world);
      const next = grip ? CURSORS[grip.handle] : null;
      if (next !== hoverCursor) setHoverCursor(next);
      return;
    }
    const v = store.getState().viewport;
    switch (a.type) {
      case "pan": {
        const dx = p.screen.x - a.start.x;
        const dy = p.screen.y - a.start.y;
        if (isDrag(dx, dy, 3)) a.moved = true;
        store.setViewport({
          x: Math.round(a.from.x + dx),
          y: Math.round(a.from.y + dy),
          zoom: a.from.zoom,
        });
        break;
      }
      case "move": {
        const sx = p.screen.x - a.start.x;
        const sy = p.screen.y - a.start.y;
        if (!a.moved) {
          if (!isDrag(sx, sy)) return;
          if (a.moving.length === 0) {
            // Nothing can move (a locked frame, a read-only canvas): the drag draws a box instead.
            active.current = {
              type: "box",
              start: a.start,
              base: a.toggle ? store.getState().selection : new Set(),
              additive: a.toggle,
              moved: false,
            };
            onPointerMove(e);
            return;
          }
          a.moved = true;
          store.beginGesture("Move");
        }
        store.dispatch({
          type: "drag",
          from: a.moving,
          anchor: a.anchor,
          dx: sx / v.zoom,
          dy: sy / v.zoom,
          snap: !p.alt,
        });
        break;
      }
      case "resize":
        store.dispatch({
          type: "resize-handle",
          id: a.id,
          handle: a.handle,
          from: a.from,
          dx: (p.screen.x - a.start.x) / v.zoom,
          dy: (p.screen.y - a.start.y) / v.zoom,
          keepAspect: p.shift,
          snap: !p.alt,
        });
        break;
      case "box": {
        const rect = rectFromPoints(a.start, p.screen);
        if (!a.moved && !isDrag(rect.w, rect.h, 3)) return;
        a.moved = true;
        setBand(rect);
        const tl = screenToWorld(v, { x: rect.x, y: rect.y });
        const found = store.query({
          type: "in-rect",
          rect: { x: tl.x, y: tl.y, w: rect.w / v.zoom, h: rect.h / v.zoom },
          mode: boxMode,
        });
        store.select([...a.base, ...found]);
        break;
      }
      case "lasso": {
        const last = a.points.at(-1)!;
        if (Math.abs(last.x - p.screen.x) + Math.abs(last.y - p.screen.y) < 3) return;
        a.points.push(p.screen);
        a.moved = true;
        setLasso([...a.points]);
        const found = store.query({
          type: "in-lasso",
          polygon: a.points.map((q) => screenToWorld(v, q)),
        });
        store.select([...a.base, ...found]);
        break;
      }
      case "connect": {
        const under =
          typeof document.elementFromPoint === "function"
            ? document.elementFromPoint(e.clientX, e.clientY)
            : null;
        const handleEl = under?.closest<HTMLElement>("[data-canvas-handle]");
        const itemEl = (handleEl ?? under)?.closest<HTMLElement>("[data-canvas-item]");
        const overId = itemEl?.dataset.canvasItem;
        let over: ConnectionEnd | null = null;
        if (overId && overId !== a.from.itemId) {
          over = handleEl?.dataset.canvasHandle
            ? { itemId: overId, handle: handleEl.dataset.canvasHandle }
            : { itemId: overId };
        } else if (!overId) {
          const hit = store.query({ type: "hit", point: p.world });
          if (hit && hit.id !== a.from.itemId) over = { itemId: hit.id };
        }
        if (over && canConnect && !canConnect(a.from, over)) over = null;
        store.setConnection({ from: a.from, point: p.world, over });
        break;
      }
      case "tool":
        a.gesture.move?.(p);
        break;
    }
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement> | null, cancelled: boolean) => {
    const a = active.current;
    active.current = null;
    if (e) rootRef.current?.releasePointerCapture?.(e.pointerId);
    setPanning(false);
    if (!a) return;
    switch (a.type) {
      case "pan":
        if (cancelled) store.setViewport(a.from);
        else if (!a.moved && a.clears) store.clearSelection();
        break;
      case "move":
        if (a.moved) {
          if (cancelled) store.cancelGesture();
          else store.endGesture();
        } else if (!a.toggle && !cancelled) store.select([a.id]);
        break;
      case "resize":
        if (cancelled) store.cancelGesture();
        else store.endGesture();
        break;
      case "box":
      case "lasso":
        setBand(null);
        setLasso(null);
        if (cancelled) store.select(a.base);
        else if (!a.moved && !a.additive) store.clearSelection();
        break;
      case "connect": {
        const c = store.getState().connection;
        store.setConnection(null);
        if (!cancelled && c && e) onConnect?.(a.from, c.over, c.point);
        break;
      }
      case "tool":
        if (cancelled || !e) a.gesture.cancel?.();
        else a.gesture.up?.(pointer(e));
        break;
    }
  };

  /* ---- keyboard */

  const focusItem = useCallback(
    (id: string) => {
      const item = store.get(id);
      if (!item) return;
      const s = store.getState();
      const seen = visibleWorld(s.viewport, s.size);
      const b = item.bounds;
      if (
        b.x < seen.x ||
        b.y < seen.y ||
        b.x + b.w > seen.x + seen.w ||
        b.y + b.h > seen.y + seen.h
      ) {
        store.centerOnItem(id);
      }
      setFocusId(id);
      if (listMode.current) {
        // The offscreen list: the surface keeps the focus, its active descendant is the item.
        if (!store.getState().selection.has(id)) store.select([id]);
        rootRef.current?.focus({ preventScroll: true });
        return;
      }
      // The item may only be rendered after the camera moved: focus it on the next frame too.
      const go = () =>
        rootRef.current
          ?.querySelector<HTMLElement>(`[data-canvas-item="${cssEscape(id)}"]`)
          ?.focus({ preventScroll: true });
      go();
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(go);
    },
    [store],
  );

  const onItemFocus = useCallback(
    (id: string) => {
      setFocusId(id);
      if (!store.getState().selection.has(id)) store.select([id]);
    },
    [store],
  );

  const runKey = (
    e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
  ) => {
    for (const t of tools) {
      if (t.shortcut && matchShortcut(e, t.shortcut)) {
        store.setTool(t.id);
        return true;
      }
    }
    for (const b of CANVAS_KEYMAP) {
      if (matchShortcut(e, b.combo)) return runCommand(store, b.command, nudge);
    }
    return false;
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    delete e.currentTarget.dataset.pointer;
    if (isField(e.target)) return;
    if (e.key === " ") {
      e.preventDefault();
      if (!space.current) {
        space.current = true;
        setSpaceHeld(true);
      }
      return;
    }
    if (e.key === "Escape" && active.current) {
      e.preventDefault();
      finish(null, true);
      return;
    }
    const itemEl = (e.target as Element).closest<HTMLElement>("[data-canvas-item]");
    // With the offscreen list, the item is the surface's active descendant.
    const activeId = listMode.current && e.target === e.currentTarget ? focusRef.current : null;
    const current = itemEl?.dataset.canvasItem
      ? store.get(itemEl.dataset.canvasItem)
      : activeId
        ? store.get(activeId)
        : undefined;
    if (
      !current &&
      listMode.current &&
      e.target === e.currentTarget &&
      e.key === "Tab" &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      // Into the items: the first in reading order.
      const first = store.query({ type: "reading-order" })[0];
      if (first) {
        e.preventDefault();
        focusItem(first);
      }
      return;
    }
    if (current) {
      if (e.key === "Tab" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const order = store.query({ type: "reading-order" });
        const next = order[order.indexOf(current.id) + (e.shiftKey ? -1 : 1)];
        if (next) {
          e.preventDefault();
          focusItem(next);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onItemActivate?.(current);
        return;
      }
      const dir = ARROWS[e.key];
      if (dir && e.altKey) {
        e.preventDefault();
        const next = store.query({ type: "nearest", from: current.id, direction: dir });
        if (next) focusItem(next);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        store.clearSelection();
        setFocusId(null);
        rootRef.current?.focus();
        return;
      }
    }
    if (keyboard !== false && runKey(e.nativeEvent)) e.preventDefault();
  };

  const onKeyUp = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === " ") {
      space.current = false;
      setSpaceHeld(false);
    }
  };

  const pageBindings = useMemo(() => {
    const out: Record<string, () => void> = {};
    for (const t of tools) if (t.shortcut) out[t.shortcut] = () => store.setTool(t.id);
    for (const b of CANVAS_KEYMAP) out[b.combo] ??= () => runCommand(store, b.command, nudge);
    return out;
  }, [store, tools, nudge]);
  useShortcuts(pageBindings, { enabled: keyboard === "page" });

  /* ---- announcements and focus upkeep */

  // The selection is announced as the store changes it, whoever changed it.
  const labelRef = useRef(itemLabel);
  useEffect(() => {
    labelRef.current = itemLabel;
  }, [itemLabel]);
  useEffect(() => {
    let last = store.getState().selection;
    return store.subscribe(() => {
      const next = store.getState().selection;
      if (next === last) return;
      const had = last.size;
      last = next;
      if (next.size === 0) {
        if (had) setAnnouncement("Selection cleared");
      } else if (next.size === 1) {
        const item = store.get([...next][0]!);
        if (item) setAnnouncement(`${labelRef.current(item)}, selected`);
      } else setAnnouncement(`${next.size} items selected`);
    });
  }, [store]);

  // A focused item that was deleted no longer counts (`items` re-renders this when one is).
  const liveFocus = focusId && store.get(focusId) ? focusId : null;

  /* ---- what is drawn */

  // Culling: the overlay holds the items in the cull window, plus the selected and the focused
  // ones. The window moves in steps (hysteresis), so a small pan mounts and unmounts nothing.
  const cull = useCullWindow(store, overscan);
  const selectFar = useCallback(
    (s: CanvasState<D>) => farZoom > 0 && s.viewport.zoom < farZoom,
    [farZoom],
  );
  const isFar = useCanvasState(store, selectFar);
  const farKinds = far?.kinds;
  const keepKey = far?.keep?.join("\n") ?? "";
  const overlay = hasFarView ? far?.overlay : undefined;
  // Everything the kinds draw is on the GPU at every zoom.
  const gpuAll = !!(overlay && farKinds);
  // The selection's chrome on the GPU (or over the DOM, near, when asked).
  const chromeOnGpu = gpuAll && !(far?.chromeOverDom && !isFar);
  // The GPU draws the items: the DOM no longer holds their words, an offscreen list does.
  const listOn = !!farKinds && (gpuAll || isFar);
  // The items in the cull window, bottom first: the index answers, read by id.
  const culled = useMemo(() => {
    if (!cull) return items;
    const visible = store.query({
      type: "visible",
      viewport: { x: -cull.x, y: -cull.y, zoom: 1 },
      size: { w: cull.w, h: cull.h },
    });
    return visible.map((id) => store.get(id)).filter((i): i is (typeof items)[number] => !!i);
  }, [store, items, cull]);

  // What the DOM should hold. In the far view: the items that have no far drawing, the focused
  // one and those the consumer keeps; the rest is drawn by the far layer.
  const target = useMemo(
    () =>
      domTarget(
        {
          store,
          items,
          culled,
          selection,
          // With the offscreen list, the focus is the list's: the item needs no DOM for it.
          liveFocus: listOn ? null : liveFocus,
          farKinds,
          keepKey,
          overlay,
        },
        isFar,
      ),
    [store, items, culled, selection, liveFocus, isFar, farKinds, keepKey, overlay, listOn],
  );

  // Crossing the far zoom changes what the DOM holds all at once (hundreds of items): the DOM
  // catches up a few dozen items a frame instead, while the far layer draws those not there yet.
  const targetRef = useRef(target);
  const [phase, setPhase] = useState<ReadonlySet<string> | null>(null);
  const [phaseFar, setPhaseFar] = useState(isFar);
  // What the DOM held at the last render: where the steps start from when the view flips.
  const [rendered, setRendered] = useState<ReadonlySet<string>>(() => new Set());
  if (phaseFar !== isFar) {
    setPhaseFar(isFar);
    setPhase(phase ?? rendered);
  } else if (gpuAll && !phase && target.length > rendered.size + FIRST_MOUNTS) {
    // The GPU draws everything already: when the window grows by many overlays at once (a zoom
    // out), the DOM catches up with their words a few a frame too.
    let added = 0;
    for (const i of target) if (!rendered.has(i.id) && ++added > FIRST_MOUNTS) break;
    if (added > FIRST_MOUNTS) setPhase(rendered);
  }
  useLayoutEffect(() => {
    targetRef.current = target;
  }, [target]);
  const mounts = useRef({ perFrame: FIRST_MOUNTS, started: 0 });
  useLayoutEffect(() => {
    const m = mounts.current;
    if (!m.started) return;
    // How long the last step took, from its frame to its commit: the next one mounts accordingly.
    const took = performance.now() - m.started;
    m.started = 0;
    if (took > STEP_BUDGET) m.perFrame = Math.max(4, Math.floor(m.perFrame / 2));
    else if (took < STEP_BUDGET / 2) m.perFrame = Math.min(256, m.perFrame * 2);
  }, [phase]);
  useEffect(() => {
    if (!phase) {
      mounts.current.perFrame = FIRST_MOUNTS;
      return;
    }
    return nextFrame(() => {
      mounts.current.started = performance.now();
      setPhase((p) => (p ? stepMounted(p, targetRef.current, mounts.current.perFrame) : null));
    });
  }, [phase]);

  const shown = useMemo(
    () => (phase ? items.filter((i) => phase.has(i.id)) : target),
    [phase, items, target],
  );
  const shownIds = useMemo(() => new Set(shown.map((i) => i.id)), [shown]);
  if (rendered !== shownIds) setRendered(shownIds);
  const targetIds = useMemo(
    () => (phase ? new Set(target.map((i) => i.id)) : null),
    [phase, target],
  );

  const tabbableId = useMemo(() => {
    if (liveFocus) return liveFocus;
    const first = items.find((i) => selection.has(i.id));
    return first?.id ?? store.query({ type: "reading-order" })[0] ?? null;
  }, [store, liveFocus, items, selection]);

  // With the offscreen list, the focus follows the selection: the active item is the focused one
  // while it is selected, else the last selected; none without a selection.
  const activeId = !listOn
    ? liveFocus
    : selection.size === 0
      ? null
      : liveFocus && selection.has(liveFocus)
        ? liveFocus
        : ([...selection].at(-1) ?? null);
  useLayoutEffect(() => {
    listMode.current = listOn;
    focusRef.current = activeId;
  });

  // The offscreen list: the items in the cull window (the nearest the view's centre when there
  // are many), the focused one and some selected ones, in reading order (rows, then columns).
  const a11yItems = useMemo(() => {
    if (!listOn) return [];
    let list = [...culled];
    if (list.length > A11Y_LIMIT) {
      const { viewport: v, size } = store.getState();
      const c = screenToWorld(v, { x: size.w / 2, y: size.h / 2 });
      // Each distance once (squared), then a numeric sort: thousands of items, every cull step.
      const near = list.map((i) => {
        const dx = i.bounds.x + i.bounds.w / 2 - c.x;
        const dy = i.bounds.y + i.bounds.h / 2 - c.y;
        return { i, d: dx * dx + dy * dy };
      });
      near.sort((a, b) => a.d - b.d);
      list = near.slice(0, A11Y_LIMIT).map((n) => n.i);
    }
    const ids = new Set(list.map((i) => i.id));
    const add = (id: string) => {
      const item = ids.has(id) ? undefined : store.get(id);
      if (!item) return;
      ids.add(id);
      list.push(item);
    };
    if (activeId) add(activeId);
    let out = 0;
    for (const id of selection) {
      if (ids.has(id)) continue;
      if (out++ >= A11Y_SELECTED_OUT) break;
      add(id);
    }
    const row = (i: Item<D>) => Math.round(i.bounds.y / 20);
    return list.sort((a, b) => row(a) - row(b) || a.bounds.x - b.bounds.x);
  }, [listOn, culled, activeId, selection, store]);
  const optionId = (id: string) => `${uid}-o-${id.replace(/[^\w-]/g, "_")}`;
  const entryId = (id: string) => `${uid}-e-${id.replace(/[^\w-]/g, "_")}`;

  // The entries the consumer adds (at most as many as items), merged in reading order.
  const a11yRows = useMemo(() => {
    type Row =
      | { item: Item<D>; entry?: undefined; y: number; x: number }
      | { item?: undefined; entry: CanvasListEntry; y: number; x: number };
    const rows: Row[] = a11yItems.map((item) => ({ item, y: item.bounds.y, x: item.bounds.x }));
    if (!listOn || !listEntries?.length) return rows;
    let entries: ReadonlyArray<CanvasListEntry> = listEntries;
    if (entries.length > A11Y_LIMIT) {
      const { viewport: v, size } = store.getState();
      entries = nearest(listEntries, screenToWorld(v, { x: size.w / 2, y: size.h / 2 }));
      const active = listEntries.find((e) => e.active);
      if (active && !entries.includes(active)) entries = [...entries, active];
    }
    for (const entry of entries) rows.push({ entry, y: entry.at.y, x: entry.at.x });
    const row = (r: Row) => Math.round(r.y / 20);
    return rows.sort((a, b) => row(a) - row(b) || a.x - b.x);
  }, [a11yItems, listOn, listEntries, store]);
  const activeEntry = listOn && !activeId ? listEntries?.find((e) => e.active) : undefined;

  // Apart from the scene: the same array while only the camera moves, so the renderer keeps them.
  const primitives = useMemo<Scene["primitives"]>(
    () =>
      primitive
        ? shown.flatMap((i) => {
            const p = primitive(i);
            return p
              ? [{ id: i.id, bounds: i.bounds, primitive: p, selected: selection.has(i.id) }]
              : [];
          })
        : NO_PRIMITIVES,
    [shown, primitive, selection],
  );

  // What the selection chrome needs, apart from the camera: read by id, not by scanning the items.
  // In the far view the far layer outlines the selection; the chrome outlines only the selected
  // items still in the DOM, which cover the far layer.
  const chrome = useMemo(() => {
    void items; // the selected items' bounds change with them
    const selected: Item<D>[] = [];
    if (selectionChrome) {
      for (const id of selection) {
        const item = store.get(id);
        if (item) selected.push(item);
      }
    }
    const single = selected.length === 1 ? selected[0]! : null;
    const handles = single ? store.query({ type: "handles", id: single.id }) : [];
    const outlined = chromeOnGpu
      ? []
      : isFar
        ? selected.filter((i) => shownIds.has(i.id))
        : selected;
    return { selected, single, handles, outlined };
  }, [store, items, selection, selectionChrome, isFar, shownIds, chromeOnGpu]);

  // The far layer's primitives: in the far view, the culled items that have a far drawing and the
  // selection's outlines; while the DOM catches up after crossing back, the items not there yet.
  // Rebuilt when the items, the selection or the window change, never on a camera move.
  // Each item's primitives, kept while the item and the kinds stay the same objects.
  const farMovesOn = !!far?.moves;
  const farDepends = far?.depends;
  // Per item id: what it was drawn from (its item, its flags, the box it depends on), its
  // primitives as made, and where its item was then.
  const farCache = useMemo(() => {
    // A new `depends` or `moves` draws everything again, as new kinds do.
    void farDepends;
    void farMovesOn;
    return (
      farKinds &&
      new Map<
        string,
        {
          item: Item<D>;
          selected: boolean;
          kept: boolean;
          shown: boolean;
          dep: Bounds | undefined;
          prims: ReadonlyArray<FarPrimitive>;
          group: FarGroup;
          /** The item's place when `prims` were made. */
          x: number;
          y: number;
        }
      >()
    );
  }, [farKinds, farDepends, farMovesOn]);
  const farItems = useMemo(() => {
    if (!farKinds || !farCache) return null;
    if (!isFar && !phase && !gpuAll) return null;
    const cache = farCache;
    const list = isFar || gpuAll ? culled : target.filter((i) => !shownIds.has(i.id));
    // One group per item: the layer packs again only the items whose drawing changed, and moves
    // those drawn the same elsewhere (a drag) without packing them.
    const out: FarGroup[] = [];
    const kept = keepKey ? new Set(keepKey.split("\n")) : null;
    for (const item of list) {
      const drawFar = farKinds[item.kind];
      if (!drawFar) continue;
      const sel = selection.has(item.id);
      const keep = !!kept?.has(item.id);
      const dom = shownIds.has(item.id);
      const dep = farDepends?.(item);
      let hit = cache.get(item.id);
      const flags = !!hit && hit.selected === sel && hit.kept === keep && hit.shown === dom;
      if (hit && flags && hit.item === item && sameBox(hit.dep, dep, 0, 0)) {
        // The same item, drawn the same.
      } else if (hit && flags && farMovesOn && movedWhole(hit.item, item, hit.dep, dep)) {
        // Moved by whole units with what it depends on: its drawing moved, by an offset.
        const dx = item.bounds.x - hit.x;
        const dy = item.bounds.y - hit.y;
        hit.item = item;
        hit.dep = dep;
        hit.group = { key: item.id, prims: hit.prims, dx, dy };
      } else {
        const prims = drawFar(item, { selected: sel, kept: keep, shown: dom }) ?? NO_FAR;
        hit = {
          item,
          selected: sel,
          kept: keep,
          shown: dom,
          dep,
          prims,
          group: { key: item.id, prims },
          x: item.bounds.x,
          y: item.bounds.y,
        };
        cache.set(item.id, hit);
      }
      if (hit.prims.length) out.push(hit.group);
    }
    // Items gone for good are let go; those out of the window are kept, as the layer keeps them.
    if (cache.size > list.length * 4 + 4096) {
      for (const id of cache.keys()) if (!store.get(id)) cache.delete(id);
    }
    return out;
  }, [
    farKinds,
    farCache,
    farMovesOn,
    farDepends,
    isFar,
    phase,
    gpuAll,
    culled,
    target,
    shownIds,
    selection,
    keepKey,
    store,
  ]);

  // The selection on the GPU: its outlines in the far view; with `overlay`, at every zoom, with
  // the handles, the box and the lasso, rounded to screen pixels as the DOM chrome draws them.
  // An outline per selected item, kept per item object: a selection dragged moves its outlines
  // by their groups' offsets, nothing is packed again.
  const outlines = outlinesOf(store);
  const farChrome = useMemo(() => {
    if (!farKinds || !selectionChrome || (!isFar && !chromeOnGpu)) return null;
    const groups: FarGroup[] = [];
    const out: Array<FarPrimitive & { outset?: number }> = [];
    const outline = {
      stroke: "--accent",
      strokeWidth: 1,
      strokeUnit: "screen",
      chrome: true,
    } as const;
    if (outlines.size > chrome.selected.length * 4 + 64) outlines.clear();
    for (const item of chrome.selected) {
      const b = item.bounds;
      let o = outlines.get(item.id);
      if (!o || o.w !== b.w || o.h !== b.h) {
        o = { ...b, prims: [{ type: "rect", ...b, ...outline, outset: 0.5 }] };
        outlines.set(item.id, o);
      }
      // The same outline, moved: its group's offset, nothing packed.
      groups.push({ key: item.id, prims: o.prims, dx: b.x - o.x, dy: b.y - o.y });
    }
    if (!chromeOnGpu) return groups;
    if (chrome.single) {
      for (const h of chrome.handles) {
        const at = handlePosition(chrome.single.bounds, h);
        out.push({
          type: "rect",
          x: at.x,
          y: at.y,
          w: 0,
          h: 0,
          fill: "--bg",
          ...outline,
          outset: 4,
        });
      }
    }
    const v = store.getState().viewport;
    const wash = "color-mix(in srgb, var(--accent) 7%, transparent)";
    if (band) {
      const tl = screenToWorld(v, { x: band.x, y: band.y });
      out.push({
        type: "rect",
        ...tl,
        w: band.w / v.zoom,
        h: band.h / v.zoom,
        fill: wash,
        ...outline,
        outset: 0.5,
      });
    }
    if (lasso && lasso.length > 1) {
      const points = lasso.flatMap((q) => {
        const w = screenToWorld(v, { x: Math.round(q.x), y: Math.round(q.y) });
        return [w.x, w.y];
      });
      out.push({ type: "polygon", points, fill: wash });
      out.push({ type: "line", points, color: "--accent", width: 1, unit: "screen", closed: true });
    }
    // The handles, the box and the lasso above the outlines.
    if (out.length) groups.push({ key: "\u0000chrome", prims: out });
    return groups;
  }, [store, farKinds, selectionChrome, isFar, chromeOnGpu, chrome, band, lasso, outlines]);
  // Drawn whenever the consumer gives them: flow keeps its edges here until its DOM edges are back.
  const farBelow = far?.below ?? NO_FAR;

  // The scene is put together with the camera of the moment, here and from the store listener.
  const parts = useRef({ primitives, chrome, band, lasso, gpu: chromeOnGpu });
  const farOn = useRef(false);
  const transform = useRef("");
  const draw = useCallback(() => {
    const { viewport, size } = store.getState();
    const world = worldRef.current;
    const t = worldTransform(viewport);
    if (world && t !== transform.current) {
      world.style.transform = t;
      transform.current = t;
    }
    if (farOn.current) farRef.current?.draw(viewport, size);
    const renderer = rendererRef.current;
    if (!renderer) return;
    const p = parts.current;
    const box = p.chrome.single ? boundsToScreen(viewport, p.chrome.single.bounds) : null;
    renderer.render({
      viewport,
      size,
      grid: { size: store.grid.size, visible: store.grid.visible },
      primitives: p.primitives,
      // Only the outlines on screen: a selection of thousands, near, draws the few in view.
      outlines: onScreen(
        p.chrome.outlined.map((i) => boundsToScreen(viewport, i.bounds)),
        size,
      ),
      handles:
        box && !p.gpu
          ? p.chrome.handles.map((h) => ({ handle: h, at: handlePosition(box, h) }))
          : [],
      band: p.gpu ? null : p.band,
      lasso: p.gpu ? null : p.lasso,
    });
  }, [store]);

  // Each layer is packed again only when its primitives change: a box drawn over a selection of
  // thousands repacks the chrome, not the items.
  useLayoutEffect(() => {
    const layer = farRef.current;
    if (!layer) return;
    const on =
      (farItems !== null && farItems.length > 0) ||
      farBelow.length > 0 ||
      (farChrome !== null && farChrome.length > 0);
    if (on) {
      const set = farSet.current;
      const put = (
        name: FarLayerName,
        given: ReadonlyArray<FarPrimitive> | ReadonlyArray<FarGroup>,
      ) => {
        const was = set[name];
        // The cull window moved but holds the same items (all of them, at fit): the same
        // groups, kept per item, so the layer is not asked again.
        if (was === given || (was?.length === given.length && was.every((p, i) => p === given[i])))
          return;
        set[name] = given;
        if (given.length && "prims" in given[0]!) layer.setGroups(name, given as FarGroup[]);
        else layer.set(name, given as ReadonlyArray<FarPrimitive>);
      };
      put("below", farBelow);
      put("items", farItems ?? NO_GROUPS);
      put("chrome", farChrome ?? NO_GROUPS);
    }
    layer.show(on);
    farOn.current = on;
  }, [farItems, farBelow, farChrome, hasFarView]);

  useLayoutEffect(() => {
    parts.current = { primitives, chrome, band, lasso, gpu: chromeOnGpu };
    draw();
  }, [
    primitives,
    chrome,
    band,
    lasso,
    chromeOnGpu,
    draw,
    makeRenderer,
    farItems,
    farBelow,
    farChrome,
  ]);

  useLayoutEffect(() => {
    let { viewport, size } = store.getState();
    return store.subscribe(() => {
      const s = store.getState();
      if (s.viewport === viewport && s.size === size) return;
      viewport = s.viewport;
      size = s.size;
      draw();
    });
  }, [store, draw]);

  const toolDef = tools.find((t) => t.id === tool);
  const cursor = panning
    ? "grabbing"
    : spaceHeld || tool === PAN_TOOL
      ? "grab"
      : (hoverCursor ?? toolDef?.cursor ?? undefined);

  const onDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = e.target as Element;
    if (el.closest("[data-canvas-overlay]") || isField(el)) return;
    const world = screenToWorld(store.getState().viewport, local(e));
    const hit = store.query({ type: "hit", point: world });
    if (hit) onItemActivate?.(hit);
    else if (!readOnly) onSurfaceDoubleClick?.(world);
  };

  const onContext = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!onContextMenu || (e.target as Element).closest("[data-canvas-overlay]")) return;
    e.preventDefault();
    const world = screenToWorld(store.getState().viewport, local(e));
    const hit = store.query({ type: "hit", point: world });
    if (hit && !store.getState().selection.has(hit.id)) store.select([hit.id]);
    onContextMenu(hit, world, e);
  };

  return (
    <CanvasProvider store={store}>
      <div
        ref={rootRef}
        className={["fg-canvas", className].filter(Boolean).join(" ")}
        style={{ ...style, ...(cursor ? { cursor } : {}) }}
        role="application"
        aria-roledescription="canvas"
        aria-label={label}
        aria-activedescendant={
          listOn && activeId
            ? optionId(activeId)
            : activeEntry
              ? entryId(activeEntry.id)
              : undefined
        }
        tabIndex={0}
        data-tool={tool}
        data-panning={panning || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finish(e, false)}
        onPointerCancel={(e) => finish(e, true)}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            space.current = false;
            setSpaceHeld(false);
          }
        }}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContext}
      >
        <div ref={underRef} className="fg-canvas-under" />
        <div
          ref={worldRef}
          className="fg-canvas-world"
          style={{ transform: worldTransform(store.getState().viewport) }}
        >
          {layers?.below ? <div className="fg-canvas-layer">{layers.below}</div> : null}
          <div
            className="fg-canvas-items"
            role={listOn ? undefined : "listbox"}
            aria-label={listOn ? undefined : `${label}: items`}
            aria-multiselectable={listOn ? undefined : "true"}
          >
            {shown.map((item) => (
              <ItemView
                key={item.id}
                item={item}
                selected={selection.has(item.id)}
                far={targetIds && !targetIds.has(item.id) ? !isFar : isFar}
                option={!listOn}
                tabbable={item.id === tabbableId}
                label={itemLabel(item)}
                render={renderItem}
                onFocus={onItemFocus}
              />
            ))}
          </div>
          {layers?.above ? <div className="fg-canvas-layer">{layers.above}</div> : null}
        </div>
        <div ref={overRef} className="fg-canvas-over" />
        {children ? (
          <div className="fg-canvas-overlay" data-canvas-overlay="">
            {children}
          </div>
        ) : null}
        {listOn ? (
          // The items for assistive technology, the DOM no longer holding their words: culled,
          // the surface's active descendant the focused one.
          <div
            className="fg-visually-hidden fg-canvas-a11y"
            role="listbox"
            aria-label={`${label}: items`}
            aria-multiselectable="true"
          >
            {a11yRows.map(({ item, entry }) =>
              item ? (
                <A11yOption
                  key={item.id}
                  id={optionId(item.id)}
                  item={item.id}
                  selected={selection.has(item.id)}
                  role={itemRole?.(item)}
                  label={itemLabel(item)}
                />
              ) : (
                <A11yOption
                  key={`\u0000${entry.id}`}
                  id={entryId(entry.id)}
                  entry={entry.id}
                  selected={!!entry.selected}
                  role={entry.role}
                  label={entry.label}
                />
              ),
            )}
          </div>
        ) : null}
        <div className="fg-visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </div>
    </CanvasProvider>
  );
}
