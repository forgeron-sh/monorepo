/**
 * The loop under `play` and `playCompiled`: a scene handle on a canvas, one engine call per frame,
 * handed to a presenter (docs/blueprint/engine.md §3). `play.ts` and `play-compiled.ts` only make
 * the handle, so that a page playing compiled scenes imports neither the reader nor the writer.
 */
import { type Filter, plan } from "../core/filters";
import { type ResolvedPalette, resolvePalette } from "../core/palette";
import { rasterSize } from "../core/render";
import type { BlueprintScene, ScriptScene } from "../engine/scene";
import { FRAME_FLAGS } from "../engine/layout";
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

/** What the overlay says of a data scene. */
export interface SceneText {
  title?: string | undefined;
  description?: string | undefined;
  labels: readonly string[];
}

/** The handle's framing options from a page's (`fill`, `unit`, `labels`). */
export function fitOf(options: PlayOptions): {
  fill?: number;
  unit?: "even" | "any";
  labels?: boolean;
} {
  return {
    ...(options.fill !== undefined ? { fill: options.fill } : {}),
    ...(options.unit !== undefined ? { unit: options.unit } : {}),
    ...(options.labels !== undefined ? { labels: options.labels } : {}),
  };
}

/**
 * Plays a handle: `text` is the data scene's (null for a script scene, which gets no pointer
 * input and no overlay unless asked).
 */
export function run(
  canvas: HTMLCanvasElement,
  scene: BlueprintScene | ScriptScene,
  text: SceneText | null,
  options: PlayOptions,
): Player {
  const win = canvas.ownerDocument.defaultView;
  const reduced = () =>
    options.reducedMotion ?? win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const data = text !== null;
  const machines = data && (scene as BlueprintScene).encoded.machines.length > 0;
  if (options.active !== undefined) scene.set("active", options.active);

  let gl: WebGL2Presenter | null = options.presenter === "webgl2" ? presentWebGL2(canvas) : null;
  const presenter: Presenter = gl ?? present2d(canvas);
  const access: Overlay | null =
    (options.overlay ?? data)
      ? overlay(
          canvas,
          text
            ? { title: text.title, description: text.description, labels: [...text.labels] }
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
      if (machines && !visible) draw(now());
      else request();
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
