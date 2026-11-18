// The camera: from screen to world and back, zoom around a point, the zoom presets, fitting a
// rectangle in view. Pure functions of a viewport; the translation is kept on whole pixels so the
// grid and 1 px lines stay crisp.

import { inflate, intersects } from "./geometry";
import type { Bounds, Point, Size, Viewport } from "./types";

export interface ZoomLimits {
  min: number;
  max: number;
  /** The stops of the zoom buttons and keys, ascending. */
  presets: ReadonlyArray<number>;
}

export const DEFAULT_ZOOM: ZoomLimits = {
  min: 0.1,
  max: 4,
  presets: [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4],
};

export const IDENTITY: Viewport = { x: 0, y: 0, zoom: 1 };

export function screenToWorld(v: Viewport, p: Point): Point {
  return { x: (p.x - v.x) / v.zoom, y: (p.y - v.y) / v.zoom };
}

export function worldToScreen(v: Viewport, p: Point): Point {
  return { x: p.x * v.zoom + v.x, y: p.y * v.zoom + v.y };
}

/** A world rectangle on screen. */
export function boundsToScreen(v: Viewport, b: Bounds): Bounds {
  return { x: b.x * v.zoom + v.x, y: b.y * v.zoom + v.y, w: b.w * v.zoom, h: b.h * v.zoom };
}

/** The part of the world a surface of `size` shows. */
export function visibleWorld(v: Viewport, size: Size): Bounds {
  return { x: -v.x / v.zoom, y: -v.y / v.zoom, w: size.w / v.zoom, h: size.h / v.zoom };
}

export function clampZoom(zoom: number, limits: Pick<ZoomLimits, "min" | "max"> = DEFAULT_ZOOM) {
  return Math.min(limits.max, Math.max(limits.min, zoom));
}

/** The translation on whole pixels: the grid and the 1 px lines never land between two. */
export function roundViewport(v: Viewport): Viewport {
  return { x: Math.round(v.x), y: Math.round(v.y), zoom: v.zoom };
}

/** Zooms to `zoom`, keeping the world point under `anchor` (screen) where it is. */
export function zoomAt(
  v: Viewport,
  zoom: number,
  anchor: Point,
  limits: Pick<ZoomLimits, "min" | "max"> = DEFAULT_ZOOM,
): Viewport {
  const z = clampZoom(zoom, limits);
  return roundViewport({
    x: anchor.x - ((anchor.x - v.x) * z) / v.zoom,
    y: anchor.y - ((anchor.y - v.y) * z) / v.zoom,
    zoom: z,
  });
}

/** The next preset above (`1`) or below (`-1`) the current zoom; the limit when there is none. */
export function stepZoom(zoom: number, direction: 1 | -1, limits: ZoomLimits = DEFAULT_ZOOM) {
  const eps = 1e-6;
  const list = limits.presets.filter((p) => p >= limits.min && p <= limits.max);
  if (direction > 0) return list.find((p) => p > zoom + eps) ?? limits.max;
  return [...list].reverse().find((p) => p < zoom - eps) ?? limits.min;
}

/**
 * The factor of a wheel event: a trackpad pinch (reported with `ctrlKey`) moves in small steps, a
 * mouse wheel with a modifier in larger ones.
 */
export function wheelZoomFactor(deltaY: number, pinch: boolean): number {
  return Math.exp(-deltaY * (pinch ? 0.01 : 0.0015));
}

export function panBy(v: Viewport, dx: number, dy: number): Viewport {
  return roundViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom });
}

export interface FitOptions {
  /** Screen pixels kept free around the rectangle. */
  padding?: number;
  /** Never zooms in past this, so a lone small item is not blown up. */
  maxZoom?: number;
  limits?: Pick<ZoomLimits, "min" | "max">;
}

/** The viewport that shows `bounds` whole and centred in a surface of `size`. */
export function fitBounds(bounds: Bounds, size: Size, options: FitOptions = {}): Viewport {
  const { padding = 60, maxZoom = 1, limits = DEFAULT_ZOOM } = options;
  const pad = Math.min(padding, size.w / 4, size.h / 4);
  const zoom = clampZoom(
    Math.min(
      maxZoom,
      (size.w - pad * 2) / Math.max(1, bounds.w),
      (size.h - pad * 2) / Math.max(1, bounds.h),
    ),
    limits,
  );
  return roundViewport({
    x: (size.w - bounds.w * zoom) / 2 - bounds.x * zoom,
    y: (size.h - bounds.h * zoom) / 2 - bounds.y * zoom,
    zoom,
  });
}

/** Keeps the zoom and puts a world point in the middle of the surface. */
export function centerOn(v: Viewport, p: Point, size: Size): Viewport {
  return roundViewport({
    x: size.w / 2 - p.x * v.zoom,
    y: size.h / 2 - p.y * v.zoom,
    zoom: v.zoom,
  });
}

/** A step of an animation between two viewports, `t` from 0 to 1, linear in log-zoom. */
export function lerpViewport(a: Viewport, b: Viewport, t: number): Viewport {
  if (t >= 1) return b;
  const zoom = Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, zoom };
}

/** Whether a world rectangle shows in the view, with a margin in screen pixels: culling. */
export function intersectsView(v: Viewport, size: Size, b: Bounds, margin = 0): boolean {
  return intersects(inflate(visibleWorld(v, size), margin / v.zoom), b);
}
