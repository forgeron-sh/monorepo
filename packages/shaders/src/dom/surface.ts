import { type ColorRef, resolveRef, type RGB } from "../core/color";

/**
 * The canvas glue every shader of the module shares: reads tokens, honours
 * `prefers-reduced-motion`, redraws on resize and animates only while on screen.
 */

export interface ShaderHandle {
  destroy(): void;
}

/** A handle that can draw its frame again at once (a driven value changed while it stands still). */
export interface RedrawHandle extends ShaderHandle {
  redraw(): void;
}

/** True when the canvas must stay still: the option when given, else the reader's preference. */
export function prefersStill(el: Element, override?: boolean): boolean {
  if (override !== undefined) return override;
  const win = el.ownerDocument.defaultView;
  return win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Reads custom properties on `el` (so a theme scoped to a section applies). */
export function tokenReader(el: Element): (name: string) => string | undefined {
  let style: CSSStyleDeclaration | undefined;
  return (name) => {
    style ??= el.ownerDocument.defaultView?.getComputedStyle(el);
    return style?.getPropertyValue(name);
  };
}

/**
 * A colour for a shader: a CSS custom property (`--accent`) read on `el`, so a theme scoped to a
 * section applies, or a literal colour; the fallback when neither parses.
 */
export function readTone(el: Element, value: string, fallback: string): RGB {
  return resolveRef(value, tokenReader(el), fallback);
}

/** A colour reference (`ColorRef`) resolved on `el`. */
export function resolveColor(el: Element, ref: ColorRef, fallback = "#000"): RGB {
  return resolveRef(ref, tokenReader(el), fallback);
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
): RedrawHandle {
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
    redraw: () => draw(now()),
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      sized.disconnect();
      seen.disconnect();
    },
  };
}

/**
 * Colour references resolved on `el` once, until `reset` (called on resize, as the effects
 * always read their tokens then).
 */
export function colorCache(el: Element): {
  resolve(ref: ColorRef): RGB;
  reset(): void;
} {
  let cache = new Map<string, RGB>();
  return {
    resolve(ref) {
      const key = typeof ref === "string" ? ref : `${ref.var}|${ref.fallback}`;
      let c = cache.get(key);
      if (!c) {
        c = resolveColor(el, ref);
        cache.set(key, c);
      }
      return c;
    },
    reset() {
      cache = new Map();
    },
  };
}
