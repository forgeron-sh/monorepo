// <Minimap>: the whole document in a small framed box, items as flat blocks (the selection in the
// accent), the view as a 1 px accent frame. Pressing or dragging in it moves the view there. A mouse
// shortcut only: the keys (fit, zoom, Tab through items) do the same for everyone.

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { unionBounds } from "../core/geometry";
import type { Item } from "../core/types";
import { centerOn, visibleWorld } from "../core/viewport";
import { useCanvasContext, useCanvasState } from "./context";

export interface MinimapProps<D = unknown> {
  /** In CSS pixels; 180 × 112 by default. */
  width?: number;
  height?: number;
  /** The fill of an item that is not selected: a CSS colour or variable name (`--success`). */
  colorOf?: (item: Item<D>) => string | undefined;
  className?: string;
}

interface Mapping {
  scale: number;
  ox: number;
  oy: number;
}

export function Minimap<D = unknown>({
  width = 180,
  height = 112,
  colorOf,
  className,
}: MinimapProps<D>) {
  const store = useCanvasContext<D>();
  const items = useCanvasState(store, (s) => s.items);
  const selection = useCanvasState(store, (s) => s.selection);
  const viewport = useCanvasState(store, (s) => s.viewport);
  const size = useCanvasState(store, (s) => s.size);
  const ref = useRef<HTMLCanvasElement>(null);
  const mapping = useRef<Mapping | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const css = getComputedStyle(canvas);
    const color = (value: string) =>
      value.startsWith("--") ? css.getPropertyValue(value).trim() : value;
    const view = visibleWorld(viewport, size);
    const all = unionBounds([...items.map((i) => i.bounds), ...(size.w ? [view] : [])]);
    if (!all) return;
    const pad = 6;
    const scale = Math.min(
      (width - pad * 2) / Math.max(1, all.w),
      (height - pad * 2) / Math.max(1, all.h),
    );
    const ox = (width - all.w * scale) / 2 - all.x * scale;
    const oy = (height - all.h * scale) / 2 - all.y * scale;
    mapping.current = { scale, ox, oy };
    for (const item of items) {
      const b = item.bounds;
      ctx.fillStyle = selection.has(item.id)
        ? color("--accent")
        : color(colorOf?.(item) ?? "--ink-dim");
      ctx.fillRect(
        Math.round(b.x * scale + ox),
        Math.round(b.y * scale + oy),
        Math.max(2, Math.round(b.w * scale)),
        Math.max(2, Math.round(b.h * scale)),
      );
    }
    if (size.w) {
      ctx.strokeStyle = color("--accent");
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.round(view.x * scale + ox) + 0.5,
        Math.round(view.y * scale + oy) + 0.5,
        Math.max(2, Math.round(view.w * scale) - 1),
        Math.max(2, Math.round(view.h * scale) - 1),
      );
    }
  }, [items, selection, viewport, size, width, height, colorOf]);

  const go = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const m = mapping.current;
    if (!m) return;
    const r = e.currentTarget.getBoundingClientRect();
    const world = {
      x: (e.clientX - r.left - m.ox) / m.scale,
      y: (e.clientY - r.top - m.oy) / m.scale,
    };
    const s = store.getState();
    store.setViewport(centerOn(s.viewport, world, s.size));
  };

  return (
    <canvas
      ref={ref}
      className={["fg-canvas-minimap", className].filter(Boolean).join(" ")}
      style={{ width, height }}
      aria-hidden="true"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        go(e);
      }}
      onPointerMove={(e) => {
        if (dragging.current) go(e);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    />
  );
}
