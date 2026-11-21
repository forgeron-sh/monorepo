import { type Filter, plan } from "../core/filters";
import { type ResolvedPalette, paint, resolvePalette } from "../core/palette";
import { frameView, rasterSize, render } from "../core/render";
import { gridCell } from "../core/svg";
import type { SceneSource, View } from "../core/types";

export interface MountOptions {
  filters?: readonly Filter[];
  /** A fixed highlighted index; wins over `cycle`. */
  active?: number;
  /** Highlights each index in turn: `count` indices, `every` seconds each. */
  cycle?: { every: number; count: number };
  /** `false` leaves the labels out. */
  labels?: boolean;
  /** Called when the highlighted index changes. */
  onActive?: (active: number) => void;
  /** Called after each drawn frame (the React layer hides its static SVG on the first). */
  onDraw?: () => void;
  /** Overrides `prefers-reduced-motion` (tests, a pause button). */
  reducedMotion?: boolean;
}

export interface Mounted {
  /** Swaps the scene or the options; refits and redraws. */
  update(source: SceneSource, options?: MountOptions): void;
  /** Stops the loop and the observers. */
  destroy(): void;
}

/**
 * Draws a scene on a canvas and keeps it drawn: refits on resize, animates only while the canvas
 * is on screen, draws a single frame at `t = 0` under `prefers-reduced-motion`, and a static scene
 * once per size. Colours are read from the CSS variables of the palette, on the canvas (so a
 * scoped theme applies), when it mounts and on each resize.
 *
 * Frames come from the engine's immediate mode (`render`): in a browser, `await initBlueprint()`
 * first. A page that drives scenes by vars, machines or hover uses `play`.
 */
export function mount(
  canvas: HTMLCanvasElement,
  initial: SceneSource,
  initialOptions: MountOptions = {},
): Mounted {
  let source = initial;
  let options = initialOptions;
  const ctx = canvas.getContext("2d");
  const win = canvas.ownerDocument.defaultView;
  const reduced = () =>
    options.reducedMotion ?? win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const start = performance.now();
  let raf = 0;
  let visible = false;
  let lastActive = Number.NaN;
  let state: { width: number; height: number; view: View; colors: ResolvedPalette } | null = null;

  const animated = () => typeof source === "function" && !reduced();
  const now = () => (reduced() ? 0 : (performance.now() - start) / 1000);

  const measure = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const p = plan(options.filters);
    const [w, h] = rasterSize(width, height, p.pixel);
    const style = win?.getComputedStyle(canvas);
    const colors = resolvePalette(p.colors, (name) => style?.getPropertyValue(name) || undefined);
    const scale = p.gap > 0 ? p.pixel : 1;
    canvas.width = w * scale;
    canvas.height = h * scale;
    canvas.style.imageRendering = "pixelated";
    state = { width, height, view: frameView(source, w, h), colors };
  };

  const draw = (t: number) => {
    if (!ctx || !state || state.width === 0 || state.height === 0) return;
    const { cycle } = options;
    const active =
      options.active ?? (cycle && cycle.every > 0 ? Math.floor(t / cycle.every) % cycle.count : -1);
    if (active !== lastActive) {
      lastActive = active;
      options.onActive?.(active);
    }
    const { frame, plan: p } = render(source, {
      width: state.width,
      height: state.height,
      filters: options.filters,
      t,
      active,
      labels: options.labels,
      view: state.view,
    });
    const rgba = paint(frame, state.colors);
    if (p.gap > 0) {
      const px = p.pixel;
      const cell = gridCell(px, p.gap);
      const W = frame.width * px;
      const out = ctx.createImageData(W, frame.height * px);
      for (let y = 0; y < frame.height; y++)
        for (let x = 0; x < frame.width; x++) {
          const i = (y * frame.width + x) * 4;
          if (!rgba[i + 3]) continue;
          for (let dy = 0; dy < cell; dy++)
            for (let dx = 0; dx < cell; dx++) {
              const o = ((y * px + dy) * W + x * px + dx) * 4;
              out.data[o] = rgba[i] ?? 0;
              out.data[o + 1] = rgba[i + 1] ?? 0;
              out.data[o + 2] = rgba[i + 2] ?? 0;
              out.data[o + 3] = 255;
            }
        }
      ctx.putImageData(out, 0, 0);
    } else {
      const img = ctx.createImageData(frame.width, frame.height);
      img.data.set(rgba);
      ctx.putImageData(img, 0, 0);
    }
    options.onDraw?.();
  };

  const loop = () => {
    draw(now());
    if (visible && animated()) raf = requestAnimationFrame(loop);
  };
  const restart = () => {
    cancelAnimationFrame(raf);
    if (visible) loop();
  };

  measure();
  const resize =
    typeof ResizeObserver === "undefined"
      ? null
      : // A resize clears the canvas: redraw at once, on screen or not, so it is never left blank.
        new ResizeObserver(() => {
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
    // No observer (an old browser, a test DOM): treat the canvas as visible.
    visible = true;
    loop();
  }

  return {
    update(next, nextOptions) {
      source = next;
      if (nextOptions) options = nextOptions;
      measure();
      restart();
    },
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      resize?.disconnect();
      seen?.disconnect();
    },
  };
}
