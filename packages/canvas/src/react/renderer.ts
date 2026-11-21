// The renderer interface: what draws the primitives of a canvas (the grid, item shapes, the
// selection, handles, the box and the lasso) from a plain `Scene`. The DOM renderer below draws
// with a 2D canvas and SVG; a WebGL2 renderer drawing the vertex buffers of a WebAssembly engine
// (D-148) can take its place. Rich content (text, forms) is not the renderer's: it stays in the DOM
// overlay that `renderItem` fills. A renderer draws only; it never handles input.

import { GRID_MIN_ZOOM, gridOffset, gridStep } from "../core/grid";
import type { Bounds, Handle, Point, Size, Viewport } from "../core/types";

/** A shape the renderer draws for an item, under its DOM overlay. Colours: CSS or a token name. */
export interface Primitive {
  shape: "rect" | "ellipse";
  fill?: string;
  stroke?: string;
}

export interface ScenePrimitive {
  id: string;
  /** World units. */
  bounds: Bounds;
  primitive: Primitive;
  selected: boolean;
}

export interface Scene {
  viewport: Viewport;
  size: Size;
  grid: { size: number; visible: boolean };
  /** The visible items that have a primitive, bottom first, in world units. */
  primitives: ReadonlyArray<ScenePrimitive>;
  /** Screen pixels from here on. */
  outlines: ReadonlyArray<Bounds>;
  handles: ReadonlyArray<{ handle: Handle; at: Point }>;
  band: Bounds | null;
  lasso: ReadonlyArray<Point> | null;
}

export interface RendererLayers {
  /** Behind the DOM items: the grid and the primitives. */
  under: HTMLElement;
  /** Above them: the selection and the gestures. */
  over: HTMLElement;
}

export interface CanvasRenderer {
  mount(layers: RendererLayers): void;
  render(scene: Scene): void;
  unmount(): void;
}

const SVG = "http://www.w3.org/2000/svg";
const svg = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
) => {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};
const paint = (value: string | undefined, fallback: string) => {
  const v = value ?? fallback;
  return v.startsWith("--") ? `var(${v})` : v;
};
const px = (n: number) => Math.round(n) + 0.5;

/**
 * The reference renderer: a 2D canvas for the dotted grid, SVG for shapes and the selection. It
 * writes to the DOM only what changed since the last scene (a pan touches the grid and one
 * transform), and reads the grid colour once, again on a theme change or a resize.
 */
export function createDomRenderer(): CanvasRenderer {
  let grid: HTMLCanvasElement | null = null;
  let shapes: SVGSVGElement | null = null;
  let world: SVGGElement | null = null;
  let chrome: SVGSVGElement | null = null;
  let lastGrid = "";
  let gridColor: string | null = null;
  let last: Scene | null = null;
  let shapesSize = "";
  let chromeSize = "";
  let transform = "";
  let primitives: Scene["primitives"] | null = null;
  let chromeKey = "";
  let stopThemeWatch: (() => void) | null = null;

  const drawGrid = (scene: Scene) => {
    if (!grid) return;
    const { viewport: v, size } = scene;
    const key = `${v.x},${v.y},${v.zoom},${size.w},${size.h},${scene.grid.size},${scene.grid.visible}`;
    if (key === lastGrid) return;
    lastGrid = key;
    const ctx = grid.getContext?.("2d");
    if (!ctx || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(size.w * dpr);
    const h = Math.round(size.h * dpr);
    if (grid.width !== w || grid.height !== h) {
      grid.width = w;
      grid.height = h;
      gridColor = null;
    }
    ctx.clearRect(0, 0, w, h);
    if (!scene.grid.visible || v.zoom < GRID_MIN_ZOOM) return;
    gridColor ??= getComputedStyle(grid).getPropertyValue("--line-strong").trim() || "#2a2a2a";
    ctx.fillStyle = gridColor;
    const step = gridStep(scene.grid.size, v.zoom);
    const dot = Math.max(1, Math.round(dpr));
    for (let y = gridOffset(v.y, step); y < size.h; y += step) {
      for (let x = gridOffset(v.x, step); x < size.w; x += step) {
        ctx.fillRect(Math.round(x * dpr), Math.round(y * dpr), dot, dot);
      }
    }
  };

  /** A new theme changes the tokens: read the grid colour again and redraw. */
  const watchTheme = () => {
    const refresh = () => {
      gridColor = null;
      lastGrid = "";
      if (last) drawGrid(last);
    };
    const root = document.documentElement;
    const observer = typeof MutationObserver === "undefined" ? null : new MutationObserver(refresh);
    observer?.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    media?.addEventListener?.("change", refresh);
    return () => {
      observer?.disconnect();
      media?.removeEventListener?.("change", refresh);
    };
  };

  const setSize = (el: SVGSVGElement, size: Scene["size"], previous: string) => {
    const key = `${size.w}x${size.h}`;
    if (key === previous) return previous;
    el.setAttribute("width", String(size.w));
    el.setAttribute("height", String(size.h));
    return key;
  };

  return {
    mount({ under, over }) {
      grid = document.createElement("canvas");
      grid.className = "fg-canvas-grid";
      grid.setAttribute("aria-hidden", "true");
      shapes = svg("svg", { class: "fg-canvas-shapes", "aria-hidden": "true" });
      world = svg("g", {});
      shapes.append(world);
      chrome = svg("svg", { class: "fg-canvas-chrome", "aria-hidden": "true" });
      under.append(grid, shapes);
      over.append(chrome);
      stopThemeWatch = watchTheme();
    },
    render(scene) {
      last = scene;
      drawGrid(scene);
      const { viewport: v, size } = scene;
      if (world && shapes) {
        shapesSize = setSize(shapes, size, shapesSize);
        const t = `translate(${v.x} ${v.y}) scale(${v.zoom})`;
        if (t !== transform) {
          world.setAttribute("transform", t);
          transform = t;
        }
        if (scene.primitives !== primitives) {
          primitives = scene.primitives;
          world.replaceChildren(
            ...scene.primitives.map(({ bounds: b, primitive: p, selected }) => {
              const common = {
                fill: paint(p.fill, "--bg"),
                stroke: paint(p.stroke, "--line-strong"),
                "stroke-width": 1,
                "vector-effect": "non-scaling-stroke",
                ...(selected ? { "data-selected": "" } : {}),
              };
              return p.shape === "ellipse"
                ? svg("ellipse", {
                    cx: b.x + b.w / 2,
                    cy: b.y + b.h / 2,
                    rx: b.w / 2,
                    ry: b.h / 2,
                    ...common,
                  })
                : svg("rect", { x: b.x, y: b.y, width: b.w, height: b.h, ...common });
            }),
          );
        }
      }
      if (chrome) {
        chromeSize = setSize(chrome, size, chromeSize);
        // Screen space: what the chrome draws, rounded as it is drawn, decides whether it changed.
        const out: Array<[string, Record<string, string | number>]> = scene.outlines.map((r) => [
          "rect",
          {
            class: "fg-canvas-outline",
            x: px(r.x),
            y: px(r.y),
            width: Math.round(r.w),
            height: Math.round(r.h),
          },
        ]);
        for (const { at } of scene.handles) {
          out.push([
            "rect",
            {
              class: "fg-canvas-handle",
              x: Math.round(at.x) - 3.5,
              y: Math.round(at.y) - 3.5,
              width: 7,
              height: 7,
            },
          ]);
        }
        if (scene.band) {
          const b = scene.band;
          out.push([
            "rect",
            {
              class: "fg-canvas-band",
              x: px(b.x),
              y: px(b.y),
              width: Math.round(b.w),
              height: Math.round(b.h),
            },
          ]);
        }
        if (scene.lasso) {
          out.push([
            "polygon",
            {
              class: "fg-canvas-lasso",
              points: scene.lasso.map((q) => `${Math.round(q.x)},${Math.round(q.y)}`).join(" "),
            },
          ]);
        }
        const key = JSON.stringify(out);
        if (key !== chromeKey) {
          chromeKey = key;
          chrome.replaceChildren(
            ...out.map(([tag, attrs]) => svg(tag as "rect" | "polygon", attrs)),
          );
        }
      }
    },
    unmount() {
      stopThemeWatch?.();
      stopThemeWatch = null;
      grid?.remove();
      shapes?.remove();
      chrome?.remove();
      grid = shapes = chrome = null;
      world = null;
      last = null;
      lastGrid = shapesSize = chromeSize = transform = chromeKey = "";
      gridColor = null;
      primitives = null;
    },
  };
}
