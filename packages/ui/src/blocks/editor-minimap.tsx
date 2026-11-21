// A miniature of the world with the part on screen drawn as a rectangle: drag it to pan, click the
// map to jump, drag its corner to zoom, or use the arrows. It draws the items as plain rectangles
// from a prop and holds no state of its own: the editor owns the viewport.
//
// `Minimap` with no children draws the usual map. With children it is the root of the parts:
//
//   <Minimap label="Overview" items={items} viewport={vp} onViewportChange={setVp}>
//     <MinimapCanvas />
//     <MinimapViewport><MinimapHandle /></MinimapViewport>
//     <MinimapStatus />
//   </Minimap>

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import type { Part } from "../part";
import {
  editorBoundsOf,
  editorCenterViewport,
  editorFromMap,
  editorMinimapFit,
  editorPanViewport,
  editorScaleViewport,
  editorToMap,
  type EditorMapFit,
  type EditorRect,
} from "./editor-model";

export interface MinimapItem extends EditorRect {
  id: string;
  /** `accent` stands out (a selection), `muted` recedes. Default `default`. */
  tone?: "default" | "accent" | "muted";
}

export interface MinimapProps extends Part<
  Omit<ComponentProps<"div">, "children" | "onPointerDown">
> {
  /** Names the map: "Canvas overview". */
  label: string;
  /** The items, in world units. */
  items?: ReadonlyArray<MinimapItem>;
  /** The area the map shows. Default: what holds every item and the viewport, with a margin. */
  world?: EditorRect;
  /** What is on screen, in world units. */
  viewport: EditorRect;
  /** Called while the rectangle is dragged, resized or moved with the keys. Without it the map only shows. */
  onViewportChange?: (viewport: EditorRect) => void;
  /** Called when the drag or key press ends: the moment to save. */
  onViewportCommit?: (viewport: EditorRect) => void;
  /** Width in px. Default 200. */
  width?: number;
  /** Height in px. Default 140. */
  height?: number;
  /** A corner handle to zoom, and + and − keys. Default `true`. */
  resizable?: boolean;
  /** The widest and narrowest the viewport can get, in world units. Default: the world's width, and a fiftieth of it. */
  limits?: { minW: number; maxW: number };
  /** World units per arrow press. Default a tenth of the viewport's width. */
  step?: number;
  /** The parts of the map. Without them: the canvas, the viewport with its handle, the status. */
  children?: ReactNode;
}

interface MapContext {
  label: string;
  items: ReadonlyArray<MinimapItem>;
  area: EditorRect;
  fit: EditorMapFit;
  width: number;
  height: number;
  viewport: EditorRect;
  vp: EditorRect;
  interactive: boolean;
  resizable: boolean;
  said: string;
  onFrameDown: (event: PointerEvent<HTMLDivElement>) => void;
  onHandleDown: (event: PointerEvent<HTMLSpanElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const Ctx = createContext<MapContext | null>(null);

function useMap(part: string): MapContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <Minimap>.`);
  return ctx;
}

type Drag =
  | { kind: "pan"; dx: number; dy: number }
  | { kind: "size"; start: EditorRect; centre: { x: number; y: number }; reach: number };

/** The overview of an editor's world, with the viewport as a rectangle to drag, resize or move by key. */
export function Minimap({
  label,
  items = [],
  world,
  viewport,
  onViewportChange,
  onViewportCommit,
  width = 200,
  height = 140,
  resizable = true,
  limits,
  step,
  children,
  className,
  style,
  ...rest
}: MinimapProps) {
  // Without a world, the items' bounds with a margin (the viewport alone when there are none);
  // it does not follow the viewport, so the map keeps its scale while it is dragged.
  const itemsBox = useMemo(() => {
    if (items.length === 0) return null;
    const b = editorBoundsOf(items);
    return editorBoundsOf([b], Math.max(b.w, b.h) * 0.08);
  }, [items]);
  const area = world ?? itemsBox ?? viewport;
  const fit = editorMinimapFit(area, { w: width, h: height });
  const vp = editorToMap(viewport, area, fit);
  const bounds = limits ?? { minW: area.w / 50, maxW: area.w };
  const interactive = onViewportChange !== undefined;
  const host = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const last = useRef(viewport);
  const [said, setSaid] = useState("");
  const [grabbing, setGrabbing] = useState(false);

  const emit = (next: EditorRect) => {
    last.current = next;
    onViewportChange?.(next);
  };

  const worldAt = (event: PointerEvent) => {
    const box = host.current!.getBoundingClientRect();
    return editorFromMap({ x: event.clientX - box.left, y: event.clientY - box.top }, area, fit);
  };

  const onBackgroundDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactive || event.button !== 0) return;
    const p = worldAt(event);
    drag.current = { kind: "pan", dx: 0, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setGrabbing(true);
    emit(editorCenterViewport(viewport, p, area));
  };

  const onFrameDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactive || event.button !== 0) return;
    event.stopPropagation();
    const p = worldAt(event);
    drag.current = {
      kind: "pan",
      dx: p.x - (viewport.x + viewport.w / 2),
      dy: p.y - (viewport.y + viewport.h / 2),
    };
    event.currentTarget.parentElement!.setPointerCapture(event.pointerId);
    setGrabbing(true);
    (event.currentTarget as HTMLElement).focus();
  };

  const onHandleDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (!interactive || event.button !== 0) return;
    event.stopPropagation();
    const centre = { x: viewport.x + viewport.w / 2, y: viewport.y + viewport.h / 2 };
    const corner = { x: viewport.x + viewport.w, y: viewport.y + viewport.h };
    drag.current = {
      kind: "size",
      start: viewport,
      centre,
      reach: Math.hypot(corner.x - centre.x, corner.y - centre.y) || 1,
    };
    host.current!.setPointerCapture(event.pointerId);
    setGrabbing(true);
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = worldAt(event);
    if (d.kind === "pan") {
      emit(editorCenterViewport(viewport, { x: p.x - d.dx, y: p.y - d.dy }, area));
    } else {
      const factor = Math.hypot(p.x - d.centre.x, p.y - d.centre.y) / d.reach;
      emit(editorScaleViewport(d.start, factor, bounds, area));
    }
  };

  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setGrabbing(false);
    onViewportCommit?.(last.current);
  };

  const describe = (v: EditorRect) =>
    `Viewport at ${Math.round(v.x)}, ${Math.round(v.y)}, ${Math.round(v.w)} wide`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || event.altKey || event.metaKey || event.ctrlKey) return;
    const unit = (step ?? viewport.w / 10) * (event.shiftKey ? 5 : 1);
    let next: EditorRect | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = editorPanViewport(viewport, -unit, 0, area);
        break;
      case "ArrowRight":
        next = editorPanViewport(viewport, unit, 0, area);
        break;
      case "ArrowUp":
        next = editorPanViewport(viewport, 0, -unit, area);
        break;
      case "ArrowDown":
        next = editorPanViewport(viewport, 0, unit, area);
        break;
      case "+":
      case "=":
        if (resizable) next = editorScaleViewport(viewport, 0.8, bounds, area);
        break;
      case "-":
      case "_":
        if (resizable) next = editorScaleViewport(viewport, 1.25, bounds, area);
        break;
      case "Home":
        next = editorCenterViewport(
          viewport,
          { x: area.x + area.w / 2, y: area.y + area.h / 2 },
          area,
        );
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next) {
      emit(next);
      onViewportCommit?.(next);
      setSaid(describe(next));
    }
  };

  const ctx: MapContext = {
    label,
    items,
    area,
    fit,
    width,
    height,
    viewport,
    vp,
    interactive,
    resizable,
    said,
    onFrameDown,
    onHandleDown,
    onKeyDown,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div
        ref={host}
        data-slot="minimap"
        {...rest}
        className={cx(
          "fg-edt-map",
          interactive && "fg-edt-map-live",
          grabbing && "fg-edt-map-grab",
          className,
        )}
        style={{ width, height, ...style }}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {children ?? (
          <>
            <MinimapCanvas />
            <MinimapViewport>
              <MinimapHandle />
            </MinimapViewport>
            <MinimapStatus />
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** The drawing: the world and the items as rectangles. */
export function MinimapCanvas({
  className,
  ...rest
}: Part<Omit<ComponentProps<"svg">, "children">>) {
  const { area, fit, items, width, height } = useMap("MinimapCanvas");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      data-slot="minimap-canvas"
      {...rest}
      className={cx("fg-edt-map-svg", className)}
    >
      <rect
        x={fit.offsetX}
        y={fit.offsetY}
        width={area.w * fit.scale}
        height={area.h * fit.scale}
        className="fg-edt-map-world"
      />
      {items.map((item) => {
        const r = editorToMap(item, area, fit);
        return (
          <rect
            key={item.id}
            x={r.x}
            y={r.y}
            width={Math.max(r.w, 1)}
            height={Math.max(r.h, 1)}
            className={cx("fg-edt-map-item", item.tone && `fg-edt-map-${item.tone}`)}
          />
        );
      })}
    </svg>
  );
}

/** The rectangle of what is on screen: drag it, or use the arrows when it has focus. */
export function MinimapViewport({
  className,
  style,
  children,
  ...rest
}: Part<ComponentProps<"div">>) {
  const m = useMap("MinimapViewport");
  return (
    <div
      role="application"
      aria-roledescription="viewport"
      aria-label={m.label}
      aria-description={
        m.interactive
          ? `Arrow keys pan, Shift makes bigger steps${m.resizable ? ", plus and minus zoom" : ""}, Home centres.`
          : undefined
      }
      tabIndex={0}
      data-slot="minimap-viewport"
      {...rest}
      className={cx("fg-edt-map-frame", className)}
      style={{
        left: m.vp.x,
        top: m.vp.y,
        width: Math.max(m.vp.w, 4),
        height: Math.max(m.vp.h, 4),
        ...style,
      }}
      onPointerDown={m.onFrameDown}
      onKeyDown={m.onKeyDown}
    >
      {children}
    </div>
  );
}

/** The corner of the viewport that zooms when dragged. Nothing when the map is not live or not `resizable`. */
export function MinimapHandle({
  className,
  ...rest
}: Part<Omit<ComponentProps<"span">, "children">>) {
  const m = useMap("MinimapHandle");
  if (!m.interactive || !m.resizable) return null;
  return (
    <span
      aria-hidden="true"
      data-slot="minimap-handle"
      {...rest}
      className={cx("fg-edt-map-handle", className)}
      onPointerDown={m.onHandleDown}
    />
  );
}

/** What a key press did, said to assistive technology. */
export function MinimapStatus({
  className,
  ...rest
}: Part<Omit<ComponentProps<"span">, "children">>) {
  const { said } = useMap("MinimapStatus");
  return (
    <span
      role="status"
      data-slot="minimap-status"
      {...rest}
      className={cx("fg-visually-hidden", className)}
    >
      {said}
    </span>
  );
}
