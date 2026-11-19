// A miniature of the world with the part on screen drawn as a rectangle: drag it to pan, click the
// map to jump, drag its corner to zoom, or use the arrows. It draws the items as plain rectangles
// from a prop and holds no state of its own: the editor owns the viewport.

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "../cx";
import {
  editorBoundsOf,
  editorCenterViewport,
  editorFromMap,
  editorMinimapFit,
  editorPanViewport,
  editorScaleViewport,
  editorToMap,
  type EditorRect,
} from "./editor-model";

export interface MinimapItem extends EditorRect {
  id: string;
  /** `accent` stands out (a selection), `muted` recedes. Default `default`. */
  tone?: "default" | "accent" | "muted";
}

export interface MinimapProps {
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
  className?: string;
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
  className,
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

  return (
    <div
      ref={host}
      className={cx(
        "fg-edt-map",
        interactive && "fg-edt-map-live",
        grabbing && "fg-edt-map-grab",
        className,
      )}
      style={{ width, height }}
      onPointerDown={onBackgroundDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <svg
        className="fg-edt-map-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
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
      <div
        role="application"
        aria-roledescription="viewport"
        aria-label={label}
        aria-description={
          interactive
            ? `Arrow keys pan, Shift makes bigger steps${resizable ? ", plus and minus zoom" : ""}, Home centres.`
            : undefined
        }
        tabIndex={0}
        className="fg-edt-map-frame"
        style={{ left: vp.x, top: vp.y, width: Math.max(vp.w, 4), height: Math.max(vp.h, 4) }}
        onPointerDown={onFrameDown}
        onKeyDown={onKeyDown}
      >
        {interactive && resizable ? (
          <span className="fg-edt-map-handle" aria-hidden="true" onPointerDown={onHandleDown} />
        ) : null}
      </div>
      <span className="fg-visually-hidden" role="status">
        {said}
      </span>
    </div>
  );
}
