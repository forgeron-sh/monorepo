// <Minimap>: the whole document in a small framed box, items as flat blocks (the selection in the
// accent), the view as a 1 px accent frame. Pressing or dragging in it moves the view there. A mouse
// shortcut only: the keys (fit, zoom, Tab through items) do the same for everyone.
//
// The items are painted once into an offscreen bitmap, again only when the items, the selection,
// the colours (theme) or the mapping change; a pan or a zoom inside the document copies the bitmap
// and draws the frame. It draws outside React, from the store: a drag does not render it.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { unionBounds } from "../core/geometry";
import type { Bounds, Item, Size, Viewport } from "../core/types";
import { centerOn, visibleWorld } from "../core/viewport";
import { useCanvasContext } from "./context";

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

/** How often, at most, the items are drawn again while only they change (ms). */
const ITEMS_EVERY = 120;

/** The view's frame over the items. */
function viewBox(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  size: Size,
  m: Mapping,
  color: (value: string) => string,
) {
  if (!size.w) return;
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

export function Minimap<D = unknown>({
  width = 180,
  height = 112,
  colorOf,
  className,
}: MinimapProps<D>) {
  const store = useCanvasContext<D>();
  const theme = useThemeVersion();
  const ref = useRef<HTMLCanvasElement>(null);
  const mapping = useRef<Mapping | null>(null);
  const bitmap = useRef<{ canvas: HTMLCanvasElement; key: unknown[]; at: number } | null>(null);
  const later = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);
  const palette = useRef<{ theme: number; colors: Map<string, string> }>({
    theme: -1,
    colors: new Map(),
  });
  const drawRef = useRef<(due?: boolean) => void>(() => undefined);
  // The union of the items' bounds, kept per items list.
  const bounds = useRef<{ items: unknown; box: Bounds | null }>({ items: null, box: null });

  /** Draws the minimap from the store as it is; `due`: the exact drawing held back is due. */
  const draw = useCallback(
    (due = false) => {
      const canvas = ref.current;
      const ctx = canvas?.getContext?.("2d");
      if (!canvas || !ctx) return;
      const { viewport, size, items, selection } = store.getState();
      if (bounds.current.items !== items) {
        bounds.current = { items, box: unionBounds(items.map((i) => i.bounds)) };
      }
      const itemBounds = bounds.current.box;
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
      // The tokens are read once per theme, not at every camera step.
      if (palette.current.theme !== theme) palette.current = { theme, colors: new Map() };
      const colors = palette.current.colors;
      let css: CSSStyleDeclaration | null = null;
      const color = (value: string) => {
        if (!value.startsWith("--")) return value;
        let c = colors.get(value);
        if (c === undefined) {
          css ??= getComputedStyle(canvas);
          c = css.getPropertyValue(value).trim();
          colors.set(value, c);
        }
        return c;
      };
      // The items: from the bitmap when nothing it depends on changed.
      const key = [items, selection, colorOf, theme, w, h, m];
      let cached = bitmap.current;
      // Only the items moved (a drag: thousands of them, every step) or the mapping did (a pan at
      // fit: the view is part of what is fitted): the bitmap is moved and scaled to the new
      // mapping and drawn again at most every `ITEMS_EVERY` ms, exactly a little after the last
      // change. While changes keep coming (within twice that of the last exact drawing), the
      // exact drawing is the timer's own task.
      const now = performance.now();
      if (
        cached &&
        cached.key.every((k, i) => i === 0 || i === 6 || k === key[i]) &&
        (cached.key[0] !== items || cached.key[6] !== m)
      ) {
        const since = now - cached.at;
        const wait = ITEMS_EVERY - since;
        if (wait > 0 || (!due && since < ITEMS_EVERY * 2)) {
          if (!later.current)
            later.current = setTimeout(
              () => {
                later.current = null;
                drawRef.current(true);
              },
              Math.max(0, wait),
            );
          const m0 = cached.key[6] as Mapping;
          const k = m.scale / m0.scale;
          ctx.setTransform(k, 0, 0, k, (m.ox - m0.ox * k) * dpr, (m.oy - m0.oy * k) * dpr);
          ctx.drawImage(cached.canvas, 0, 0);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          viewBox(ctx, viewport, size, m, color);
          return;
        }
      }
      if (!cached || cached.key.some((k, i) => k !== key[i])) {
        const layer = cached?.canvas ?? document.createElement("canvas");
        layer.width = w;
        layer.height = h;
        const lc = layer.getContext("2d");
        if (lc) {
          lc.setTransform(dpr, 0, 0, dpr, 0, 0);
          // The fill is set only when it changes: parsing a colour per item costs more than its
          // box.
          let fill = "";
          for (const item of items) {
            const b = item.bounds;
            const c = selection.has(item.id)
              ? color("--accent")
              : color(colorOf?.(item) ?? "--ink-dim");
            if (c !== fill) lc.fillStyle = fill = c;
            lc.fillRect(
              Math.round(b.x * m.scale + m.ox),
              Math.round(b.y * m.scale + m.oy),
              Math.max(2, Math.round(b.w * m.scale)),
              Math.max(2, Math.round(b.h * m.scale)),
            );
          }
        }
        cached = { canvas: layer, key, at: now };
        bitmap.current = cached;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(cached.canvas, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewBox(ctx, viewport, size, m, color);
    },
    [store, colorOf, theme, width, height],
  );
  // What the held-back exact drawing calls: the drawing of the last render.
  useLayoutEffect(() => {
    drawRef.current = draw;
  }, [draw]);
  useEffect(
    () => () => {
      if (later.current) clearTimeout(later.current);
    },
    [],
  );

  // Drawn outside React: at once when the camera moves (the wheel's own step), at the next frame
  // when the items or the selection change (a drag's steps are not made longer by it).
  useLayoutEffect(() => {
    draw();
    let { viewport, size, items, selection } = store.getState();
    let frame = 0;
    const raf =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (fn: FrameRequestCallback) =>
            setTimeout(() => fn(performance.now()), 16) as unknown as number;
    const unraf =
      typeof cancelAnimationFrame === "function"
        ? cancelAnimationFrame
        : (id: number) => clearTimeout(id);
    const stop = store.subscribe(() => {
      const s = store.getState();
      if (s.viewport !== viewport || s.size !== size) {
        ({ viewport, size, items, selection } = s);
        if (frame) unraf(frame);
        frame = 0;
        draw();
        return;
      }
      if (s.items === items && s.selection === selection) return;
      items = s.items;
      selection = s.selection;
      frame ||= raf(() => {
        frame = 0;
        draw();
      });
    });
    return () => {
      stop();
      if (frame) unraf(frame);
    };
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
