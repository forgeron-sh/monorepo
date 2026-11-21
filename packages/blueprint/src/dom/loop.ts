/**
 * The frame loop of a scene on a presenter, with no DOM in it: `run` (`player.ts`) feeds it from
 * the page's observers on the main thread, `serveBlueprint` (`serve.ts`) from the page's messages
 * in a worker. Its inputs are the canvas's CSS size and resolved palette, visibility, reduced
 * motion and the pointer; it draws only while visible, holds the clock at 0 under reduced motion,
 * and hands a frame to the presenter only when the engine says the picture changed.
 */
import { type Filter, plan } from "../core/filters";
import type { ResolvedPalette } from "../core/palette";
import { rasterSize } from "../core/render";
import { FRAME_FLAGS } from "../engine/layout";
import type { BlueprintScene, ScriptScene } from "../engine/scene";
import type { Presenter } from "./present-2d";
import type { WebGL2Presenter } from "./present-webgl2";

export interface LoopOptions {
  filters?: readonly Filter[] | undefined;
  /** A data scene: it takes the pointer, and its shading is the file's unless `filters` say. */
  data: boolean;
  /** Whether motion is reduced now (read each frame). */
  reduced: () => boolean;
  /** The WebGL2 presenter, which takes the palette instead of the engine. */
  gl?: WebGL2Presenter | null;
  onDraw?: (() => void) | undefined;
}

/** The frame scheduler: `requestAnimationFrame` in a window or a worker. */
export interface Frames {
  request(fn: () => void): number;
  cancel(id: number): void;
}

export interface Loop {
  /** The canvas's CSS size and the palette resolved from its tokens: sizes the raster, refits. */
  measure(width: number, height: number, colors: ResolvedPalette): void;
  /** On screen or not: frames run only while it is. */
  visible(on: boolean): void;
  /** The pointer as a fraction of the canvas (0..1 each way), or `null` when it left. */
  pointer(x: number | null, y?: number): void;
  set(name: string, value: number): void;
  release(name: string): void;
  emit(event: string): void;
  /** Draws one frame now, at `time` seconds or the clock's. */
  draw(time?: number): void;
  /** Starts the loop again if motion came back while on screen. */
  wake(): void;
  stop(): void;
}

const windowFrames = (): Frames =>
  typeof requestAnimationFrame === "function"
    ? { request: (fn) => requestAnimationFrame(fn), cancel: (id) => cancelAnimationFrame(id) }
    : {
        request: (fn) => setTimeout(fn, 16) as unknown as number,
        cancel: (id) => clearTimeout(id),
      };

export function loop(
  scene: BlueprintScene | ScriptScene,
  presenter: Presenter,
  options: LoopOptions,
  frames: Frames = windowFrames(),
): Loop {
  const { data, reduced, gl = null } = options;
  const machines = data && (scene as BlueprintScene).encoded.machines.length > 0;
  const start = performance.now();
  let raf = 0;
  let visible = false;
  let last = Number.NaN;
  let ready = false;
  let pending = false;

  const animated = () => !reduced();
  const now = () => (reduced() ? 0 : (performance.now() - start) / 1000);

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

  const tick = () => {
    pending = false;
    draw(now());
    if (visible && animated()) raf = frames.request(tick);
  };
  /** A frame soon, when the loop is not running (reduced motion, a scroll, a hover). */
  const request = () => {
    if (visible && !animated() && !pending) {
      pending = true;
      raf = frames.request(tick);
    }
  };

  return {
    measure(width, height, colors) {
      const p = plan(options.filters);
      const [w, h] = rasterSize(width, height, p.pixel);
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
    },
    visible(on) {
      if (on && !visible) {
        visible = true;
        tick();
      } else if (!on) {
        visible = false;
        frames.cancel(raf);
      }
    },
    pointer(x, y = 0) {
      if (!data) return;
      const { width, height } = scene.size;
      scene.pointer(x === null ? null : x * width, y * height);
      request();
    },
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
    draw(time) {
      draw(time ?? now());
    },
    wake() {
      if (!visible) return;
      frames.cancel(raf);
      pending = false;
      tick();
    },
    stop() {
      visible = false;
      frames.cancel(raf);
    },
  };
}
