// Moving the camera from the chrome (zoom buttons, fit): a short glide, or a jump when the person
// asked for reduced motion. The wheel, a drag and the keys always move at once.

import type { CanvasStore } from "../core/store";
import type { Viewport } from "../core/types";
import { lerpViewport, roundViewport } from "../core/viewport";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const running = new WeakMap<object, number>();

/** Glides the store's camera to `target` in `duration` ms; jumps under reduced motion. */
export function animateViewport<D>(store: CanvasStore<D>, target: Viewport, duration = 160): void {
  const previous = running.get(store);
  if (previous !== undefined) cancelAnimationFrame(previous);
  if (duration <= 0 || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
    store.setViewport(target);
    return;
  }
  const from = store.getState().viewport;
  let start: number | null = null;
  const frame = (now: number) => {
    start ??= now;
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) * (1 - t);
    store.setViewport(t >= 1 ? target : roundViewport(lerpViewport(from, target, eased)));
    if (t < 1) running.set(store, requestAnimationFrame(frame));
    else running.delete(store);
  };
  running.set(store, requestAnimationFrame(frame));
}
