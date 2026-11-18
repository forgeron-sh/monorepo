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
import { CanvasProvider, useCanvasState } from "./context";
import { createDomRenderer, type CanvasRenderer, type Primitive, type Scene } from "./renderer";

/** What a consumer tool gets with each press. */
export interface CanvasToolApi<D = unknown> {
  store: CanvasStore<D>;
  /** The point on the grid, unless snapping is off or Alt is held. */
  snap: (point: Point, modifiers?: Partial<Modifiers>) => Point;
}

export interface RenderItemState {
  selected: boolean;
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
  /** Screen pixels around the view whose items are still rendered; 256 by default. */
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

interface ItemViewProps<D> {
  item: Item<D>;
  selected: boolean;
  tabbable: boolean;
  label: string;
  render: (item: Item<D>, state: RenderItemState) => ReactNode;
  onFocus: (id: string) => void;
}

function ItemViewInner<D>({ item, selected, tabbable, label, render, onFocus }: ItemViewProps<D>) {
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
      {render(item, { selected })}
    </div>
  );
}
const ItemView = memo(ItemViewInner) as typeof ItemViewInner;

export function Canvas<D = unknown>({
  store,
  renderItem,
  primitive,
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
  const state = useCanvasState(store, (s) => s);
  const { items, selection, viewport, size, tool } = state;
  const rootRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
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

  // A focused item that was deleted no longer counts.
  const liveFocus = focusId && items.some((i) => i.id === focusId) ? focusId : null;

  /* ---- what is drawn */

  // Culling: the overlay holds the items in view, plus the selected and the focused ones.
  const shown = useMemo(() => {
    if (!size.w) return items;
    // The index answers bottom first: read those items by id rather than filtering them all.
    const visible = store.query({ type: "visible", viewport, size, margin: overscan });
    const ids = new Set(visible);
    const extra = [...selection, ...(liveFocus ? [liveFocus] : [])].filter((id) => !ids.has(id));
    if (extra.length === 0) {
      return visible.map((id) => store.get(id)).filter((i): i is (typeof items)[number] => !!i);
    }
    // An off-screen selected or focused item: keep the document's order.
    for (const id of extra) ids.add(id);
    return items.filter((i) => ids.has(i.id));
  }, [store, items, viewport, size, overscan, selection, liveFocus]);

  const tabbableId = useMemo(() => {
    if (liveFocus) return liveFocus;
    const first = items.find((i) => selection.has(i.id));
    return first?.id ?? store.query({ type: "reading-order" })[0] ?? null;
  }, [store, liveFocus, items, selection]);

  const scene = useMemo<Scene>(() => {
    const selected =
      selectionChrome && selection.size > 0 ? items.filter((i) => selection.has(i.id)) : [];
    const single = selected.length === 1 ? selected[0]! : null;
    const handles = single ? store.query({ type: "handles", id: single.id }) : [];
    const box = single ? boundsToScreen(viewport, single.bounds) : null;
    return {
      viewport,
      size,
      grid: { size: store.grid.size, visible: store.grid.visible },
      primitives: primitive
        ? shown.flatMap((i) => {
            const p = primitive(i);
            return p
              ? [{ id: i.id, bounds: i.bounds, primitive: p, selected: selection.has(i.id) }]
              : [];
          })
        : [],
      outlines: selected.map((i) => boundsToScreen(viewport, i.bounds)),
      handles: box ? handles.map((h) => ({ handle: h, at: handlePosition(box, h) })) : [],
      band,
      lasso,
    };
  }, [store, items, shown, selection, viewport, size, primitive, selectionChrome, band, lasso]);

  useLayoutEffect(() => {
    rendererRef.current?.render(scene);
  }, [scene, makeRenderer]);

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
          className="fg-canvas-world"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          }}
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
