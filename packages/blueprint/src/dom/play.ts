/**
 * `play`: a scene on a canvas, on the engine (docs/blueprint/engine.md §3). The scene is a
 * `.bp.json` scene (`{ lib, scene }`) or a scene function or block list (the script layer); the
 * loop calls the engine once per frame and hands the result to a presenter: the 2D canvas by
 * default, WebGL2 on request (at most four per page, the 2D presenter beyond). It keeps
 * `mount`'s behaviour: refit on resize, frames only while on screen, the clock held at 0 under
 * `prefers-reduced-motion` (scroll and hover still change the picture), colours from the CSS
 * tokens on the canvas at mount and on each resize.
 *
 * The site keeps `mount` (the TypeScript raster) until it switches (P4).
 */
import { type Filter, plan } from "../core/filters";
import { type ResolvedPalette, resolvePalette } from "../core/palette";
import { rasterSize } from "../core/render";
import type { SceneSource } from "../core/types";
import {
  type BlueprintScene,
  createScene,
  createScriptScene,
  type ScriptScene,
} from "../engine/scene";
import { FRAME_FLAGS } from "../engine/layout";
import type { Library } from "../format/read";
import { overlay, type Overlay } from "./overlay";
import { present2d, type Presenter } from "./present-2d";
import { presentWebGL2, type WebGL2Presenter } from "./present-webgl2";

export interface PlayOptions {
  filters?: readonly Filter[];
  /** A fixed highlighted index (`set("active", n)`); wins over `cycle`. */
  active?: number;
  /** Highlights each index in turn (script scenes; data scenes carry their own `cycle`). */
  cycle?: { every: number; count: number };
  labels?: boolean;
  /** The page's framing over the scene's own (`data-fill`, `data-unit`). */
  fill?: number;
  unit?: "even" | "any";
  /** `"webgl2"` asks for the WebGL2 presenter (falls back to 2D beyond four per page). */
  presenter?: "2d" | "webgl2";
  /** Called after each drawn frame. */
  onDraw?: () => void;
  /** Overrides `prefers-reduced-motion`. */
  reducedMotion?: boolean;
  /** Adds the accessible overlay (title, description, labels); on by default for data scenes. */
  overlay?: boolean;
}

/** A data scene: a scene of a library read by `readBlueprint`. */
export interface DataSource {
  lib: Library;
  scene: string;
}

export interface Player {
  /** The engine's scene: its `slots`, `tags`, `view`, `frameCalls`. */
  readonly scene: BlueprintScene | ScriptScene;
  readonly presenter: Presenter;
  set(name: string, value: number): void;
  release(name: string): void;
  /** Queues a machine event (data scenes). */
  emit(event: string): void;
  /** `"active"`, any var name, `"state"`, `"hover"`. */
  on(name: string, fn: (value: number, label: string) => void): () => void;
  /** Draws one frame now (tests, a frozen clock). */
  draw(time?: number): void;
  destroy(): void;
}

const isData = (s: SceneSource | DataSource): s is DataSource =>
  typeof s === "object" && s !== null && "lib" in s && "scene" in s;

/** Label texts of a data scene, for the overlay. */
function labelsOf(source: DataSource): string[] {
  const out: string[] = [];
  for (const part of source.lib.parts.values())
    for (const p of part.prims) if (p.kind === "label") out.push(p.text);
  return out;
}

export function play(
  canvas: HTMLCanvasElement,
  source: SceneSource | DataSource,
  options: PlayOptions = {},
): Player {
  const win = canvas.ownerDocument.defaultView;
  const reduced = () =>
    options.reducedMotion ?? win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const fit = {
    ...(options.fill !== undefined ? { fill: options.fill } : {}),
    ...(options.unit !== undefined ? { unit: options.unit } : {}),
    ...(options.labels !== undefined ? { labels: options.labels } : {}),
  };
  const data = isData(source);
  const scene: BlueprintScene | ScriptScene = data
    ? createScene(source.lib, source.scene, fit)
    : createScriptScene(source, fit);
  if (!data && options.cycle) (scene as ScriptScene).cycleActive(options.cycle);
  if (options.active !== undefined) scene.set("active", options.active);

  let gl: WebGL2Presenter | null = options.presenter === "webgl2" ? presentWebGL2(canvas) : null;
  const presenter: Presenter = gl ?? present2d(canvas);
  const access: Overlay | null =
    (options.overlay ?? data)
      ? overlay(
          canvas,
          data
            ? {
                title: source.lib.scenes.get(source.scene)?.title,
                description: source.lib.scenes.get(source.scene)?.description,
                labels: labelsOf(source),
              }
            : {},
        )
      : null;

  const start = performance.now();
  let raf = 0;
  let visible = false;
  let last = Number.NaN;
  let ready = false;
  let pending = false;

  const animated = () => !reduced();
  const now = () => (reduced() ? 0 : (performance.now() - start) / 1000);

  const measure = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const p = plan(options.filters);
    const [w, h] = rasterSize(width, height, p.pixel);
    const style = win?.getComputedStyle(canvas);
    const colors: ResolvedPalette = resolvePalette(
      p.colors,
      (name) => style?.getPropertyValue(name) || undefined,
    );
    ready = width > 0 && height > 0;
    if (!ready) return;
    if (!data || options.filters) scene.shading(p.dither, p.glow);
    scene.resize(w, h);
    if (gl) {
      gl.palette(colors);
      scene.palette(null);
    } else scene.palette(colors);
    presenter.resize(w, h, p.pixel, p.gap);
    last = Number.NaN;
  };

  const draw = (t: number) => {
    if (!ready) return;
    const dt = Number.isNaN(last) || t < last ? 0 : t - last;
    last = t;
    const flags = scene.frame(t, dt);
    if (flags & FRAME_FLAGS.drawn) {
      presenter.present(scene);
      options.onDraw?.();
    }
  };

  const loop = () => {
    pending = false;
    draw(now());
    if (visible && animated()) raf = requestAnimationFrame(loop);
  };
  /** A frame soon, when the loop is not running (reduced motion, a scroll, a hover). */
  const request = () => {
    if (visible && !animated() && !pending) {
      pending = true;
      raf = requestAnimationFrame(loop);
    }
  };

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const { width, height } = scene.size;
    if (r.width === 0 || r.height === 0) return;
    scene.pointer(
      ((e.clientX - r.left) / r.width) * width,
      ((e.clientY - r.top) / r.height) * height,
    );
    request();
  };
  const onLeave = () => {
    scene.pointer(null);
    request();
  };
  if (data) {
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerleave", onLeave);
  }

  measure();
  const resize =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          measure();
          draw(now());
        });
  resize?.observe(canvas);
  const seen =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          const on = entry?.isIntersecting ?? false;
          if (on && !visible) {
            visible = true;
            loop();
          } else if (!on) {
            visible = false;
            cancelAnimationFrame(raf);
          }
        });
  if (seen) seen.observe(canvas);
  else {
    visible = true;
    loop();
  }

  return {
    scene,
    presenter,
    set(name, value) {
      scene.set(name, value);
      request();
    },
    release(name) {
      scene.release(name);
      request();
    },
    emit(event) {
      if (data) (scene as BlueprintScene).emit(event);
      request();
    },
    on: (name, fn) => scene.on(name, fn),
    draw(time) {
      draw(time ?? now());
    },
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      resize?.disconnect();
      seen?.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
      access?.dispose();
      presenter.dispose();
      gl = null;
      scene.dispose();
    },
  };
}
