// <Minimap>: the whole document in a small framed box, items as flat blocks (the selection in the
// accent), the view as a 1 px accent frame. Pressing or dragging in it moves the view there. A mouse
// shortcut only: the keys (fit, zoom, Tab through items) do the same for everyone.
//
// The items are painted once into an offscreen bitmap, again only when the items, the selection,
// the colours (theme) or the mapping change; a pan or a zoom inside the document copies the bitmap
// and draws the frame, outside React.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { unionBounds } from "../core/geometry";
import type { Bounds, Item, Size, Viewport } from "../core/types";
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

const PAD = 6;

/** Where the world lands in the box: the items and the view, fitted with a margin. */
function mappingOf(
  items: Bounds | null,
  viewport: Viewport,
  size: Size,
  width: number,
  height: number,
): Mapping | null {
  const view = visibleWorld(viewport, size);
  const all = unionBounds([...(items ? [items] : []), ...(size.w ? [view] : [])]);
  if (!all) return null;
  const scale = Math.min(
    (width - PAD * 2) / Math.max(1, all.w),
    (height - PAD * 2) / Math.max(1, all.h),
  );
  return {
    scale,
    ox: (width - all.w * scale) / 2 - all.x * scale,
    oy: (height - all.h * scale) / 2 - all.y * scale,
  };
}

const sameMapping = (a: Mapping | null, b: Mapping | null) =>
  a === b || (!!a && !!b && a.scale === b.scale && a.ox === b.ox && a.oy === b.oy);

/** A number that changes when the page's theme does: the colours are read again. */
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const observer = typeof MutationObserver === "undefined" ? null : new MutationObserver(bump);
    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    media?.addEventListener?.("change", bump);
    return () => {
      observer?.disconnect();
      media?.removeEventListener?.("change", bump);
    };
  }, []);
  return version;
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
  const theme = useThemeVersion();
  const ref = useRef<HTMLCanvasElement>(null);
  const mapping = useRef<Mapping | null>(null);
  const bitmap = useRef<{ canvas: HTMLCanvasElement; key: unknown[] } | null>(null);
  const dragging = useRef(false);

  const itemBounds = useMemo(() => unionBounds(items.map((i) => i.bounds)), [items]);

  const draw = useCallback(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d");
    if (!canvas || !ctx) return;
    const { viewport, size } = store.getState();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const next = mappingOf(itemBounds, viewport, size, width, height);
    if (!sameMapping(mapping.current, next)) mapping.current = next;
    const m = mapping.current;
    if (!m) return;
    const css = getComputedStyle(canvas);
    const colors = new Map<string, string>();
    const color = (value: string) => {
      if (!value.startsWith("--")) return value;
      let c = colors.get(value);
      if (c === undefined) {
        c = css.getPropertyValue(value).trim();
        colors.set(value, c);
      }
      return c;
    };
    // The items: from the bitmap when nothing it depends on changed.
    const key = [items, selection, colorOf, theme, w, h, m];
    let cached = bitmap.current;
    if (!cached || cached.key.some((k, i) => k !== key[i])) {
      const layer = cached?.canvas ?? document.createElement("canvas");
      layer.width = w;
      layer.height = h;
      const lc = layer.getContext("2d");
      if (lc) {
        lc.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const item of items) {
          const b = item.bounds;
          lc.fillStyle = selection.has(item.id)
            ? color("--accent")
            : color(colorOf?.(item) ?? "--ink-dim");
          lc.fillRect(
            Math.round(b.x * m.scale + m.ox),
            Math.round(b.y * m.scale + m.oy),
            Math.max(2, Math.round(b.w * m.scale)),
            Math.max(2, Math.round(b.h * m.scale)),
          );
        }
      }
      cached = { canvas: layer, key };
      bitmap.current = cached;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cached.canvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (size.w) {
      const view = visibleWorld(viewport, size);
      ctx.strokeStyle = color("--accent");
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.round(view.x * m.scale + m.ox) + 0.5,
        Math.round(view.y * m.scale + m.oy) + 0.5,
        Math.max(2, Math.round(view.w * m.scale) - 1),
        Math.max(2, Math.round(view.h * m.scale) - 1),
      );
    }
  }, [store, items, itemBounds, selection, colorOf, theme, width, height]);

  // Redrawn when what it shows changes, and on every camera move without rendering.
  useLayoutEffect(() => {
    draw();
    let { viewport, size } = store.getState();
    return store.subscribe(() => {
      const s = store.getState();
      if (s.viewport === viewport && s.size === size) return;
      viewport = s.viewport;
      size = s.size;
      draw();
    });
  }, [store, draw]);

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
