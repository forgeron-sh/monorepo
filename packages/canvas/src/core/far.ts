// The far view of a canvas: what an item looks like when the zoom is too low to read it, as plain
// primitives (boxes, ellipses, diamonds, lines, triangles, a line of text) in world units. The view
// asks each kind for them (`far.kinds` of `<Canvas>`) and draws them all on one surface (WebGL2,
// a 2D canvas without it). Packing them into instances is pure: the colours come from a resolver.

import type { Bounds } from "./types";

/**
 * A colour: a token name (`--accent`), or any CSS colour (`var(--x)`, `#hex`, `color-mix(…)`),
 * resolved on the surface, again when the theme changes.
 */
export type FarColor = string;

interface FarCommon {
  /** Cut what falls outside this world rectangle (a frame's children). */
  clip?: Bounds;
}

/** A box, an ellipse or a diamond in its bounds; the stroke is drawn inside, like a CSS border. */
export interface FarShape extends FarCommon {
  type: "rect" | "ellipse" | "diamond";
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: FarColor;
  stroke?: FarColor;
  /** The stroke's width, in world units (`world`, by default) or screen pixels. */
  strokeWidth?: number;
  strokeUnit?: "world" | "screen";
}

/** A polyline, flat `[x0, y0, x1, y1…]` in world units. */
export interface FarLine extends FarCommon {
  type: "line";
  points: ReadonlyArray<number>;
  color: FarColor;
  /** World units (`world`, by default) or screen pixels (a 1 px edge whatever the zoom). */
  width: number;
  unit?: "world" | "screen";
  closed?: boolean;
}

/** A filled triangle (an arrowhead), flat `[x0, y0, x1, y1, x2, y2]`. */
export interface FarTriangle extends FarCommon {
  type: "triangle";
  points: readonly [number, number, number, number, number, number];
  fill: FarColor;
}

/**
 * One line of text from its left end, `y` the middle of the line; drawn while it is at least
 * `minSize` screen pixels high (6 by default), and as a grey bar of its width below that.
 */
export interface FarText extends FarCommon {
  type: "text";
  x: number;
  y: number;
  text: string;
  /** Font size, world units. */
  size: number;
  color: FarColor;
  font?: "sans" | "mono";
  weight?: number;
  /** World units; the text is cut with an ellipsis past it. */
  maxWidth?: number;
  minSize?: number;
}

export type FarPrimitive = FarShape | FarLine | FarTriangle | FarText;

/** Packed colour: `r | g << 8 | b << 16 | a << 24`, straight alpha. */
export type FarRgba = number;

/** Floats per instance in a packed buffer (64 bytes). */
export const FAR_STRIDE = 16;

/** The instance kinds, as the shader reads them. */
export const FAR_KIND = { rect: 0, ellipse: 1, diamond: 2, segment: 3, triangle: 4 } as const;

const NO_CLIP = 1e30;

/**
 * Primitives packed as instances, one per shape, segment or triangle, in drawing order. Layout of
 * one instance (floats): `0–3` geometry (a box `x y w h`, a segment `x0 y0 x1 y1`, a triangle's
 * first two points), `4–7` (stroke or line width, 1 when that width is in screen pixels, outset in
 * screen pixels or the triangle's last point, kind), `8–9` the zoom range it shows in, `10` fill
 * and `11` stroke as packed colours, `12–15` the clip rectangle.
 */
export interface FarPack {
  data: Float32Array;
  /** The same memory, for the packed colours. */
  colors: Uint32Array;
  count: number;
  /** The texts, drawn apart (their bars are in the instances). */
  texts: FarText[];
}

export function createFarPack(capacity = 256): FarPack {
  const data = new Float32Array(capacity * FAR_STRIDE);
  return { data, colors: new Uint32Array(data.buffer), count: 0, texts: [] };
}

function reserve(pack: FarPack, more: number) {
  const need = (pack.count + more) * FAR_STRIDE;
  if (need <= pack.data.length) return;
  let size = pack.data.length || FAR_STRIDE * 64;
  while (size < need) size *= 2;
  const data = new Float32Array(size);
  data.set(pack.data.subarray(0, pack.count * FAR_STRIDE));
  pack.data = data;
  pack.colors = new Uint32Array(data.buffer);
}

export interface PackOptions {
  resolve: (color: FarColor) => FarRgba;
  /** A text's width in world units at its size, for the bar drawn when it is too small to read. */
  measure?: (text: FarText) => number;
}

function push(
  pack: FarPack,
  clip: Bounds | undefined,
  g0: number,
  g1: number,
  g2: number,
  g3: number,
  a: number,
  b: number,
  c: number,
  kind: number,
  fill: FarRgba,
  stroke: FarRgba,
  minZoom = 0,
  maxZoom = NO_CLIP,
) {
  const o = pack.count * FAR_STRIDE;
  const d = pack.data;
  d[o] = g0;
  d[o + 1] = g1;
  d[o + 2] = g2;
  d[o + 3] = g3;
  d[o + 4] = a;
  d[o + 5] = b;
  d[o + 6] = c;
  d[o + 7] = kind;
  d[o + 8] = minZoom;
  d[o + 9] = maxZoom;
  pack.colors[o + 10] = fill;
  pack.colors[o + 11] = stroke;
  if (clip) {
    d[o + 12] = clip.x;
    d[o + 13] = clip.y;
    d[o + 14] = clip.w;
    d[o + 15] = clip.h;
  } else {
    d[o + 12] = -NO_CLIP;
    d[o + 13] = -NO_CLIP;
    d[o + 14] = NO_CLIP * 2;
    d[o + 15] = NO_CLIP * 2;
  }
  pack.count++;
}

/**
 * Appends primitives to a pack. A selection outline is a `rect` with a screen stroke and an
 * outset: `outset` screen pixels outside its bounds (0.5 centres a 1 px line on the edge).
 */
export function packFar(
  pack: FarPack,
  prims: Iterable<FarPrimitive & { outset?: number }>,
  options: PackOptions,
): FarPack {
  const { resolve, measure } = options;
  for (const p of prims) {
    switch (p.type) {
      case "rect":
      case "ellipse":
      case "diamond": {
        const fill = p.fill ? resolve(p.fill) : 0;
        const stroke = p.stroke && (p.strokeWidth ?? 1) > 0 ? resolve(p.stroke) : 0;
        if (!fill && !stroke) break;
        reserve(pack, 1);
        push(
          pack,
          p.clip,
          p.x,
          p.y,
          p.w,
          p.h,
          stroke ? (p.strokeWidth ?? 1) : 0,
          p.strokeUnit === "screen" ? 1 : 0,
          p.outset ?? 0,
          FAR_KIND[p.type],
          fill,
          stroke,
        );
        break;
      }
      case "line": {
        const pts = p.points;
        const n = Math.floor(pts.length / 2);
        if (n < 2) break;
        const color = resolve(p.color);
        if (!color) break;
        const segs = p.closed ? n : n - 1;
        reserve(pack, segs);
        const unit = p.unit === "screen" ? 1 : 0;
        for (let i = 0; i < segs; i++) {
          const j = (i + 1) % n;
          push(
            pack,
            p.clip,
            pts[i * 2]!,
            pts[i * 2 + 1]!,
            pts[j * 2]!,
            pts[j * 2 + 1]!,
            p.width,
            unit,
            0,
            FAR_KIND.segment,
            color,
            0,
          );
        }
        break;
      }
      case "triangle": {
        const fill = resolve(p.fill);
        if (!fill) break;
        reserve(pack, 1);
        const t = p.points;
        push(pack, p.clip, t[0], t[1], t[2], t[3], t[4], t[5], 0, FAR_KIND.triangle, fill, 0);
        break;
      }
      case "text": {
        if (!p.text) break;
        pack.texts.push(p);
        const color = resolve(p.color);
        if (!color || !measure) break;
        // Too small to read: a bar of the text's width, half its height, at a third of its colour.
        const w = Math.min(measure(p), p.maxWidth ?? Infinity);
        const h = p.size * 0.5;
        const alpha = Math.round(((color >>> 24) & 0xff) * 0.35);
        const bar = ((color & 0xffffff) | (alpha << 24)) >>> 0;
        reserve(pack, 1);
        push(
          pack,
          p.clip,
          p.x,
          p.y - h / 2,
          w,
          h,
          0,
          0,
          0,
          FAR_KIND.rect,
          bar,
          0,
          0,
          (p.minSize ?? 6) / p.size,
        );
        break;
      }
    }
  }
  return pack;
}

/** Empties a pack, keeping its memory. */
export function resetFarPack(pack: FarPack): FarPack {
  pack.count = 0;
  pack.texts = [];
  return pack;
}

/** `rgba(…)`, `rgb(…)` or `color(srgb …)` as a packed colour; null for anything else. */
export function parseCssColor(css: string): FarRgba | null {
  const s = css.trim();
  let m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(s);
  let r: number, g: number, b: number, a: number;
  const alpha = (v: string | undefined) =>
    v === undefined ? 1 : v.endsWith("%") ? Number(v.slice(0, -1)) / 100 : Number(v);
  if (m) {
    r = Number(m[1]);
    g = Number(m[2]);
    b = Number(m[3]);
    a = alpha(m[4]);
  } else {
    m = /^color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(s);
    if (!m) return null;
    r = Number(m[1]) * 255;
    g = Number(m[2]) * 255;
    b = Number(m[3]) * 255;
    a = alpha(m[4]);
  }
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  if ([r, g, b, a].some((v) => Number.isNaN(v))) return null;
  return (c(r) | (c(g) << 8) | (c(b) << 16) | (c(a * 255) << 24)) >>> 0;
}
