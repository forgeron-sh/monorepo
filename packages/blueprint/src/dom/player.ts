/**
 * The player under `play` and `playCompiled`: a scene handle on a canvas, one engine call per
 * frame, handed to a presenter (docs/blueprint/engine.md §3). The loop itself is `loop.ts`; this
 * feeds it from the page (size, tokens, visibility, pointer). `play.ts` and `play-compiled.ts`
 * only make the handle, so that a page playing compiled scenes imports neither the reader nor the
 * writer.
 */
import { type Filter, plan } from "../core/filters";
import { resolvePalette } from "../core/palette";
import type { BlueprintScene, ScriptScene } from "../engine/scene";
import { loop } from "./loop";
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

  const core = loop(scene, presenter, {
    filters: options.filters,
    data,
    reduced,
    gl,
    onDraw: options.onDraw,
  });
  const measure = () => {
    const style = win?.getComputedStyle(canvas);
    const p = plan(options.filters);
    core.measure(
      canvas.clientWidth,
      canvas.clientHeight,
      resolvePalette(p.colors, (name) => style?.getPropertyValue(name) || undefined),
    );
  };

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    core.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  const onLeave = () => core.pointer(null);
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
          core.draw();
        });
  resize?.observe(canvas);
  const seen =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => core.visible(entry?.isIntersecting ?? false));
  if (seen) seen.observe(canvas);
  else core.visible(true);

  return {
    scene,
    presenter,
    set: (name, value) => core.set(name, value),
    release: (name) => core.release(name),
    emit: (event) => core.emit(event),
    on: (name, fn) => scene.on(name, fn),
    draw: (time) => core.draw(time),
    destroy() {
      core.stop();
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
