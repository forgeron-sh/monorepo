/**
 * Client side of the lab pages, on top of @forgeron/blueprint. The canvases are written in the
 * pages as plain `<canvas>` elements (so the pages' scoped styles reach them and they keep their
 * CSS size before any script runs); their attributes are the declarative options, read here once:
 *
 * - `canvas[data-iso=<scene>]`: an isometric scene of `SCENES` (`mount`). Options: `data-scale`
 *   (pixel size, 3), `data-fill`, `data-unit="any"`, `data-cycle` (seconds per highlighted index),
 *   `data-active`, `data-labels="off"`, `data-accent="off"`, `data-bg` (token of the background),
 *   `data-signal` (token for the signal family);
 * - `canvas[data-shader=ember|globe|dissolve|field]`: a generator field (`mountField`). Options:
 *   `data-px` (cell size, 4), `data-accent="off"`, `data-bg`, `data-ink`;
 * - `canvas[data-dither-img=<url>]`: a dithered picture (`mountImage`). Options: `data-px`, `data-gain`.
 *
 * Page scripts drive a scene through `isoCanvas(el)`: a typed handle instead of DOM events.
 */
import {
  type ColorRef,
  dither,
  type FieldMode,
  FIELD_MODES,
  type Filter,
  palette,
  pixelate,
  type Scene,
  type SceneFn,
} from "@forgeron/blueprint";
import {
  type Mounted,
  mount,
  type MountOptions,
  mountField,
  mountImage,
} from "@forgeron/blueprint/dom";
import { SCENES } from "./scenes";

const token = (name: string, fallback: string): ColorRef => ({ var: name, fallback });

/** A lab scene on a canvas. */
export interface IsoCanvas {
  /** Highlights index `n`, or hands the highlight back to the cycle with -1. */
  select(n: number): void;
  /** Swaps the scene for another of `SCENES`; refits and redraws. Unknown names are ignored. */
  show(scene: string): void;
  /**
   * Calls `fn` with the highlighted index each time it changes, and at once with the current one
   * if a frame was already drawn (a page script may subscribe after the first frame); returns an
   * unsubscribe.
   */
  onActive(fn: (active: number) => void): () => void;
}

const handles = new WeakMap<HTMLCanvasElement, IsoCanvas>();

/** The scene's framing options from the attributes, merged into every frame of the scene. */
function framing(el: HTMLCanvasElement, build: SceneFn): SceneFn {
  const { fill, unit } = el.dataset;
  if (fill === undefined && unit === undefined) return build;
  const fit: Scene["fit"] = {
    ...(fill !== undefined ? { fill: Number(fill) } : {}),
    ...(unit === "any" ? { unit: "any" as const } : {}),
  };
  return (frame) => {
    const s = build(frame);
    return { ...s, fit: { ...s.fit, ...fit } };
  };
}

function filtersOf(el: HTMLCanvasElement): Filter[] {
  const { scale, accent, bg, signal } = el.dataset;
  return [
    pixelate(Number(scale ?? 3)),
    dither({ matrix: 4 }),
    palette({
      ...(bg ? { bg: token(bg, "#0a0a0a") } : {}),
      // `data-accent="off"`: what would glow in ember is drawn in ink; signal stays ember.
      ...(accent === "off" ? { accent: token("--ink", "#ededed") } : {}),
      // `data-signal=<token>`: the signal family in another colour (the village's money).
      ...(signal ? { signal: token(signal, "#3ddc84") } : {}),
    }),
  ];
}

/**
 * The handle of an iso canvas, mounting it on first use (the layout's script and the page's
 * scripts may run in any order). Null when the element names no known scene.
 */
export function isoCanvas(el: HTMLElement | null): IsoCanvas | null {
  if (!(el instanceof HTMLCanvasElement)) return null;
  const known = handles.get(el);
  if (known) return known;
  const first = SCENES[el.dataset.iso ?? ""];
  if (!first) return null;
  const listeners = new Set<(active: number) => void>();
  let current: number | undefined;
  const cycle = Number(el.dataset.cycle ?? 0);
  let source = framing(el, first);
  let selected = el.dataset.active !== undefined ? Number(el.dataset.active) : -1;
  const options = (): MountOptions => ({
    filters: filtersOf(el),
    ...(selected >= 0 ? { active: selected } : {}),
    ...(cycle ? { cycle: { every: cycle, count: 5 } } : {}),
    labels: el.dataset.labels !== "off",
    onActive: (n) => {
      current = n;
      for (const fn of listeners) fn(n);
    },
  });
  const mounted: Mounted = mount(el, source, options());
  const handle: IsoCanvas = {
    select(n) {
      selected = n;
      mounted.update(source, options());
    },
    show(name) {
      const next = SCENES[name];
      if (!next) return;
      el.dataset.iso = name;
      source = framing(el, next);
      mounted.update(source, options());
    },
    onActive(fn) {
      listeners.add(fn);
      if (current !== undefined) fn(current);
      return () => listeners.delete(fn);
    },
  };
  handles.set(el, handle);
  return handle;
}

const isField = (name: string | undefined): name is FieldMode =>
  name !== undefined && name in FIELD_MODES;

for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-dither-img]")) {
  if (!c.dataset.ditherImg) continue;
  mountImage(c, c.dataset.ditherImg ?? "", {
    pixel: Number(c.dataset.px ?? 3),
    gain: Number(c.dataset.gain ?? 1.1),
  });
}
for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-shader]")) {
  const { shader, px, accent, bg, ink } = c.dataset;
  mountField(c, {
    mode: isField(shader) ? shader : "ember",
    pixel: Number(px ?? 4),
    accent: accent !== "off",
    colors: {
      ...(bg ? { bg: token(bg, "#0a0a0a") } : {}),
      ...(ink ? { ink: token(ink, "#ededed") } : {}),
    },
  });
}
for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-iso]")) isoCanvas(c);
