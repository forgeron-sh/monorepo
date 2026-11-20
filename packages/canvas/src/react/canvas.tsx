// <Canvas>: the infinite surface. It turns pointer, wheel and key events into engine commands and
// queries (pan, zoom, select, box and lasso, move, resize, connect, nudge), hands a `Scene` to a
// renderer for the primitives (grid, shapes, selection), and renders rich items in a DOM overlay
// through `renderItem`. It only talks to the store's engine interface, never to its internals.

import { matchShortcut, useShortcuts } from "@forgeron/ui";
import {
  memo,
  useCallback,
  useEffect,
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
  state: { selected: boolean },
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
   * in the far view or not: the consumer gives them while its own DOM is not there.
   */
  below?: ReadonlyArray<FarPrimitive>;
  /** Items kept in the DOM in the far view too (one being edited, the ends of an arrow). */
  keep?: ReadonlyArray<string>;
  /**
   * The GPU draws the kinds at every zoom, the selection's outlines, its handles, the box and the
   * lasso too. Above `zoom`, the DOM holds only the items in the cull window for which this says
   * yes (their text, over the GPU drawing), the focused one and those kept; below it, as in the
   * far view. `renderItem` then draws only what the GPU does not.
   */
  overlay?: (item: Item<D>) => boolean;
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
  /** Names an item for assistive technology; `<kind> <id>` by default. */
  itemLabel?: (item: Item<D>) => string;
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
  tabbable: boolean;
  label: string;
  render: (item: Item<D>, state: RenderItemState) => ReactNode;
  onFocus: (id: string) => void;
}

function ItemViewInner<D>({
  item,
  selected,
  far,
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
      role="option"
      aria-selected={selected}
      aria-label={label}
      tabIndex={tabbable ? 0 : -1}
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

/**
 * Items mounted per frame while the DOM catches up after a far/near switch: adapted to how long the
 * last step took, so a step stays near `STEP_BUDGET` ms on any machine. Unmounting is cheaper.
 */
const FIRST_MOUNTS = 16;
const STEP_BUDGET = 6;
const UNMOUNTS_PER_MOUNT = 4;
const NO_FAR: ReadonlyArray<FarPrimitive> = [];
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
  const farSet = useRef<Partial<Record<FarLayerName, ReadonlyArray<FarPrimitive>>>>({});
  const active = useRef<Active | null>(null);
  const space = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [hoverCursor, setHoverCursor] = useState<string | null>(null);
  const [band, setBand] = useState<Bounds | null>(null);
  const [lasso, setLasso] = useState<Point[] | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
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
    const current = itemEl?.dataset.canvasItem ? store.get(itemEl.dataset.canvasItem) : undefined;
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
      domTarget({ store, items, culled, selection, liveFocus, farKinds, keepKey, overlay }, isFar),
    [store, items, culled, selection, liveFocus, isFar, farKinds, keepKey, overlay],
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
    const outlined = gpuAll ? [] : isFar ? selected.filter((i) => shownIds.has(i.id)) : selected;
    return { selected, single, handles, outlined };
  }, [store, items, selection, selectionChrome, isFar, shownIds, gpuAll]);

  // The far layer's primitives: in the far view, the culled items that have a far drawing and the
  // selection's outlines; while the DOM catches up after crossing back, the items not there yet.
  // Rebuilt when the items, the selection or the window change, never on a camera move.
  // Each item's primitives, kept while the item and the kinds stay the same objects.
  const farCache = useMemo(
    () =>
      farKinds && new WeakMap<Item<D>, { selected: boolean; prims: ReadonlyArray<FarPrimitive> }>(),
    [farKinds],
  );
  const farItems = useMemo(() => {
    if (!farKinds || !farCache) return null;
    if (!isFar && !phase && !gpuAll) return null;
    const cache = farCache;
    const list = isFar || gpuAll ? culled : target.filter((i) => !shownIds.has(i.id));
    const out: Array<FarPrimitive & { outset?: number }> = [];
    for (const item of list) {
      const drawFar = farKinds[item.kind];
      if (!drawFar) continue;
      const sel = selection.has(item.id);
      let hit = cache.get(item);
      if (!hit || hit.selected !== sel) {
        hit = { selected: sel, prims: drawFar(item, { selected: sel }) ?? NO_FAR };
        cache.set(item, hit);
      }
      for (const p of hit.prims) out.push(p);
    }
    return out;
  }, [farKinds, farCache, isFar, phase, gpuAll, culled, target, shownIds, selection]);

  // The selection on the GPU: its outlines in the far view; with `overlay`, at every zoom, with
  // the handles, the box and the lasso, rounded to screen pixels as the DOM chrome draws them.
  const farChrome = useMemo(() => {
    if (!farKinds || !selectionChrome || (!isFar && !gpuAll)) return null;
    const out: Array<FarPrimitive & { outset?: number }> = [];
    const outline = {
      stroke: "--accent",
      strokeWidth: 1,
      strokeUnit: "screen",
      chrome: true,
    } as const;
    for (const item of chrome.selected) {
      const b = item.bounds;
      out.push({ type: "rect", ...b, ...outline, outset: 0.5 });
    }
    if (!gpuAll) return out;
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
    return out;
  }, [store, farKinds, selectionChrome, isFar, gpuAll, chrome, band, lasso]);
  // Drawn whenever the consumer gives them: flow keeps its edges here until its DOM edges are back.
  const farBelow = far?.below ?? NO_FAR;

  // The scene is put together with the camera of the moment, here and from the store listener.
  const parts = useRef({ primitives, chrome, band, lasso, gpu: gpuAll });
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
      outlines: p.chrome.outlined.map((i) => boundsToScreen(viewport, i.bounds)),
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
      const put = (name: FarLayerName, prims: ReadonlyArray<FarPrimitive>) => {
        const was = set[name];
        // The cull window moved but holds the same items (all of them, at fit): the same
        // primitives, kept per item, so the layer is not packed again.
        if (was === prims || (was?.length === prims.length && was.every((p, i) => p === prims[i])))
          return;
        set[name] = prims;
        layer.set(name, prims);
      };
      put("below", farBelow);
      put("items", farItems ?? NO_FAR);
      put("chrome", farChrome ?? NO_FAR);
    }
    layer.show(on);
    farOn.current = on;
  }, [farItems, farBelow, farChrome, hasFarView]);

  useLayoutEffect(() => {
    parts.current = { primitives, chrome, band, lasso, gpu: gpuAll };
    draw();
  }, [primitives, chrome, band, lasso, gpuAll, draw, makeRenderer, farItems, farBelow, farChrome]);

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
            role="listbox"
            aria-label={`${label}: items`}
            aria-multiselectable="true"
          >
            {shown.map((item) => (
              <ItemView
                key={item.id}
                item={item}
                selected={selection.has(item.id)}
                far={targetIds && !targetIds.has(item.id) ? !isFar : isFar}
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
        <div className="fg-visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </div>
    </CanvasProvider>
  );
}
