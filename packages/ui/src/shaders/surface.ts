import { parseColor, type RGB } from "@forgeron/blueprint";

/**
 * The canvas glue every shader of the module shares: reads tokens, honours
 * `prefers-reduced-motion`, redraws on resize and animates only while on screen.
 */

export interface ShaderHandle {
  destroy(): void;
}

/** True when the canvas must stay still: the option when given, else the reader's preference. */
export function prefersStill(el: Element, override?: boolean): boolean {
  if (override !== undefined) return override;
  const win = el.ownerDocument.defaultView;
  return win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * A colour for a shader: a CSS custom property (`--accent`) read on `el`, so a theme scoped to a
 * section applies, or a literal colour; the fallback when neither parses.
 */
export function readTone(el: Element, value: string, fallback: string): RGB {
  const raw = value.startsWith("--")
    ? (el.ownerDocument.defaultView?.getComputedStyle(el).getPropertyValue(value) ?? "")
    : value;
  return parseColor(raw) ?? parseColor(fallback) ?? [0, 0, 0];
}

export interface AnimateCanvasOptions {
  /** Sizes the backing store; called first and on every size change. */
  resize(): void;
  /** Draws the frame at `t` seconds. */
  draw(t: number): void;
  /** At most this many frames a second (60 by default): fields step, they do not glide. */
  fps?: number;
  /** One frame at `t = 0`, no loop. */
  still: boolean;
}

/**
 * Keeps `canvas` drawn: a frame at once and after every resize (a resize clears a canvas, so it is
 * never left blank), then a loop while it intersects the viewport, stopped off screen.
 */
export function animateCanvas(
  canvas: HTMLCanvasElement,
  options: AnimateCanvasOptions,
): ShaderHandle {
  const { resize, draw, still } = options;
  const step = 1000 / (options.fps ?? 60);
  const start = performance.now();
  const now = () => (still ? 0 : (performance.now() - start) / 1000);
  let raf = 0;
  let last = -Infinity;
  let visible = false;

  const loop = (ts: number) => {
    if (ts - last >= step - 1) {
      last = ts;
      draw(now());
    }
    if (visible) raf = requestAnimationFrame(loop);
  };
  const sized = new ResizeObserver(() => {
    resize();
    draw(now());
  });
  sized.observe(canvas);
  resize();
  draw(now());
  const seen = new IntersectionObserver(([entry]) => {
    const on = entry?.isIntersecting ?? false;
    if (on && !visible && !still) {
      visible = true;
      last = -Infinity;
      raf = requestAnimationFrame(loop);
    } else if (!on) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  });
  seen.observe(canvas);

  return {
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      sized.disconnect();
      seen.disconnect();
    },
  };
}
