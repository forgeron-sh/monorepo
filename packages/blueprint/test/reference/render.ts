import { rasterize } from "./draw";
import { type Filter, type Plan, plan } from "./filters";
import { createFrame, type Frame } from "./frame";
import { fit } from "./project";
import { shade } from "./shade";
import type { Scene, SceneSource, View } from "./types";

export interface RenderOptions {
  /** Size of the target in CSS pixels; the raster is that divided by the pixel size. */
  width: number;
  height: number;
  filters?: readonly Filter[];
  /** Time in seconds, for an animated scene (0 by default). */
  t?: number;
  /** Highlighted index, for an animated scene (-1 by default). */
  active?: number;
  /** `false` leaves the labels out. */
  labels?: boolean;
  /** A view computed earlier (`frameView`), to keep the framing while the scene moves. */
  view?: View;
}

export interface Rendered {
  frame: Frame;
  view: View;
  plan: Plan;
}

/** The scene of a source at time `t`. */
export function sceneAt(source: SceneSource, t = 0, active = -1): Scene {
  return typeof source === "function" ? source({ t, active }) : source;
}

/** Raster size for a target size and a pixel size. */
export function rasterSize(width: number, height: number, pixel: number): [number, number] {
  return [Math.max(1, Math.floor(width / pixel)), Math.max(1, Math.floor(height / pixel))];
}

/**
 * The framing of a source on a raster: computed on the scene at its `fit.at` time (0 by
 * default), so that an animated scene keeps one framing for all its frames.
 */
export function frameView(source: SceneSource, rasterWidth: number, rasterHeight: number): View {
  const probe = sceneAt(source, 0, 0);
  const at = probe.fit?.at ?? 0;
  const scene = at === 0 ? probe : sceneAt(source, at, 0);
  return fit(scene.blocks, rasterWidth, rasterHeight, scene.fit);
}

/**
 * One frame: plans the filters, rasterises the scene at the raster resolution (the hoisted
 * `pixelate`) into materials, then shades it (dither, glow). Palette and grid are applied by the
 * outputs, which keep colours as references until the last moment.
 */
export function render(source: SceneSource, options: RenderOptions): Rendered {
  const p = plan(options.filters);
  const [w, h] = rasterSize(options.width, options.height, p.pixel);
  const view = options.view ?? frameView(source, w, h);
  const frame = createFrame(w, h);
  const scene = sceneAt(source, options.t ?? 0, options.active ?? -1);
  rasterize(frame, scene.blocks, view, { labels: options.labels });
  shade(frame, p);
  return { frame, view, plan: p };
}
