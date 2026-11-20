// The GPU view of a canvas: what an item looks like as plain primitives (boxes, ellipses, diamonds
// with solid or dither fills and dashed strokes, lines, triangles, runs of pixels, images, a line
// of text) in world units. The view asks each kind for them (`far.kinds` of `<Canvas>`) and draws
// them all on one surface (WebGL2, a 2D canvas without it): below the far zoom for every canvas
// that has a far view, at every zoom for one that asks for it (`far.overlay`). Packing them into
// instances is pure: the colours come from a resolver.

import type { Bounds } from "./types";

/**
 * A colour: a token name (`--accent`), or any CSS colour (`var(--x)`, `#hex`, `color-mix(…)`),
 * resolved on the surface, again when the theme changes.
 */
export type FarColor = string;

interface FarCommon {
  /** Cut what falls outside this world rectangle (a frame's children). */
  clip?: Bounds;
  /** Drawn only from this zoom (included) to `maxZoom` (excluded). */
  minZoom?: number;
  maxZoom?: number;
}

/**
 * A dash pattern, `[on, off]`, in the unit of the stroke; the first dash starts where the path
 * starts (a box's top-left corner going right, an ellipse's right end going down, a diamond's top).
 */
export type FarDash = readonly [number, number];

/** A box, an ellipse or a diamond in its bounds; the stroke is drawn inside, like a CSS border. */
export interface FarShape extends FarCommon {
  type: "rect" | "ellipse" | "diamond";
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: FarColor;
  /** Multiplies the fill's alpha. */
  opacity?: number;
  /**
   * A 4 × 4 dither of the fill, bit `row * 4 + column` lit, its pixels `patternPixel` world units
   * wide, anchored at the world's origin (as an SVG pattern in user space). Under a device pixel,
   * the pattern is drawn as a wash of its density.
   */
  pattern?: number;
  patternPixel?: number;
  stroke?: FarColor;
  /** The stroke's width, in world units (`world`, by default) or screen pixels. */
  strokeWidth?: number;
  strokeUnit?: "world" | "screen";
  dash?: FarDash;
  /** Edges on whole device pixels, as SVG's `crispEdges` (boxes, pixel art). */
  crisp?: boolean;
  /**
   * Screen chrome (a selection outline, a handle): the box is rounded to whole screen pixels and
   * grown by `floor(outset)` before and `ceil(outset)` after, as the DOM chrome rounds it.
   */
  chrome?: boolean;
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
  /**
   * The ends of an open line: `square` (by default) reaches half the width past them, `butt` stops
   * at them. Inner joints always reach past, which is a miter for the right angles of an elbow.
   */
  cap?: "square" | "butt";
  dash?: FarDash;
}

/** A filled triangle (an arrowhead), flat `[x0, y0, x1, y1, x2, y2]`. */
export interface FarTriangle extends FarCommon {
  type: "triangle";
  points: readonly [number, number, number, number, number, number];
  fill: FarColor;
}

/**
 * Rows of whole pixels (a pixel pen stroke): `runs` holds `column, row, length` triples in pixel
 * cells, a cell `sx` × `sy` world units from `x`, `y`. Each run is one crisp box.
 */
export interface FarRuns extends FarCommon {
  type: "runs";
  x: number;
  y: number;
  sx: number;
  sy: number;
  runs: ArrayLike<number>;
  color: FarColor;
}

/** An image stretched to its box (`preserveAspectRatio="none"`), uploaded once it has loaded. */
export interface FarImage extends FarCommon {
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
}

/** A filled polygon (a lasso), any shape; its outline is a `line` of its own. */
export interface FarPolygon extends FarCommon {
  type: "polygon";
  points: ReadonlyArray<number>;
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

export type FarPrimitive =
  | FarShape
  | FarLine
  | FarTriangle
  | FarRuns
  | FarImage
  | FarPolygon
  | FarText;

/** Packed colour: `r | g << 8 | b << 16 | a << 24`, straight alpha. */
export type FarRgba = number;

/** Floats per instance in a packed buffer (96 bytes). */
export const FAR_STRIDE = 24;

/** The instance kinds, as the shader reads them. */
export const FAR_KIND = {
  rect: 0,
  ellipse: 1,
  diamond: 2,
  segment: 3,
  triangle: 4,
  image: 5,
} as const;

/** Bits of an instance's flags (float 19). */
export const FAR_FLAG = { crisp: 1, chrome: 2, capStart: 4, capEnd: 8 } as const;

const NO_CLIP = 1e30;

/**
 * Primitives packed as instances, one per shape, segment, triangle, run or image, in drawing order.
 * Layout of one instance (floats): `0–3` geometry (a box `x y w h`, a segment `x0 y0 x1 y1`, a
 * triangle's first two points), `4–7` (stroke or line width, 1 when that width is in screen
 * pixels, outset in screen pixels or the triangle's last point, kind), `8–9` the zoom range it
 * shows in, `10` fill and `11` stroke as packed colours, `12–15` the clip rectangle, `16–19` dash
 * on, dash off, where the dash pattern starts along the path, flags (`FAR_FLAG`), `20–23` the
 * pattern's bits, its pixel, the image's index in `images`, the pattern's density.
 */
export interface FarPack {
  data: Float32Array;
  /** The same memory, for the packed colours. */
  colors: Uint32Array;
  count: number;
  /** The texts, drawn apart (their bars are in the instances). */
  texts: FarText[];
  /** The images, in drawing order: `index` is the instance that draws each. */
  images: Array<{ index: number; src: string }>;
  /** The filled polygons, drawn before the instances. */
  polygons: Array<{ points: ReadonlyArray<number>; fill: FarRgba; clip?: Bounds }>;
}

export function createFarPack(capacity = 256): FarPack {
  const data = new Float32Array(capacity * FAR_STRIDE);
  return {
    data,
    colors: new Uint32Array(data.buffer),
    count: 0,
    texts: [],
    images: [],
    polygons: [],
  };
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

/** Extra fields of an instance, after the first sixteen floats. */
interface Extra {
  dashOn?: number;
  dashOff?: number;
  dashStart?: number;
  flags?: number;
  pattern?: number;
  patternPixel?: number;
  image?: number;
}
const NONE: Extra = {};

function push(
  pack: FarPack,
  p: FarCommon,
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
  extra: Extra = NONE,
  maxZoom = p.maxZoom ?? NO_CLIP,
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
  d[o + 8] = p.minZoom ?? 0;
  d[o + 9] = maxZoom;
  pack.colors[o + 10] = fill;
  pack.colors[o + 11] = stroke;
  const clip = p.clip;
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
  d[o + 16] = extra.dashOn ?? 0;
  d[o + 17] = extra.dashOff ?? 0;
  d[o + 18] = extra.dashStart ?? 0;
  d[o + 19] = extra.flags ?? 0;
  const bits = extra.pattern ?? 0;
  d[o + 20] = bits;
  d[o + 21] = extra.patternPixel ?? 0;
  d[o + 22] = extra.image ?? -1;
  d[o + 23] = bits ? density(bits) : 0;
  pack.count++;
}

/** The share of a 4 × 4 pattern's cells that are lit. */
function density(bits: number): number {
  let n = 0;
  for (let i = 0; i < 16; i++) if (bits & (1 << i)) n++;
  return n / 16;
}

/** A packed colour with its alpha multiplied by `k`. */
function fade(color: FarRgba, k: number): FarRgba {
  if (k >= 1) return color;
  const a = Math.round(((color >>> 24) & 0xff) * Math.max(0, k));
  return ((color & 0xffffff) | (a << 24)) >>> 0;
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
        const fill = p.fill ? fade(resolve(p.fill), p.opacity ?? 1) : 0;
        const stroke = p.stroke && (p.strokeWidth ?? 1) > 0 ? resolve(p.stroke) : 0;
        if (!(fill >>> 24) && !(stroke >>> 24)) break;
        reserve(pack, 1);
        const flags = (p.crisp ? FAR_FLAG.crisp : 0) | (p.chrome ? FAR_FLAG.chrome : 0);
        const dashed = stroke && p.dash && p.dash[0] > 0 && p.dash[1] > 0;
        push(
          pack,
          p,
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
          flags || dashed || p.pattern
            ? {
                flags,
                ...(dashed ? { dashOn: p.dash![0], dashOff: p.dash![1] } : {}),
                ...(p.pattern ? { pattern: p.pattern, patternPixel: p.patternPixel ?? 1 } : {}),
              }
            : NONE,
        );
        break;
      }
      case "line": {
        const pts = p.points;
        const n = Math.floor(pts.length / 2);
        if (n < 2) break;
        const color = resolve(p.color);
        if (!(color >>> 24)) break;
        const segs = p.closed ? n : n - 1;
        reserve(pack, segs);
        const unit = p.unit === "screen" ? 1 : 0;
        const butt = p.cap === "butt" && !p.closed;
        const dashed = p.dash && p.dash[0] > 0 && p.dash[1] > 0;
        let along = 0;
        for (let i = 0; i < segs; i++) {
          const j = (i + 1) % n;
          const x0 = pts[i * 2]!;
          const y0 = pts[i * 2 + 1]!;
          const x1 = pts[j * 2]!;
          const y1 = pts[j * 2 + 1]!;
          const flags =
            (butt && i === 0 ? 0 : FAR_FLAG.capStart) |
            (butt && i === segs - 1 ? 0 : FAR_FLAG.capEnd);
          push(pack, p, x0, y0, x1, y1, p.width, unit, 0, FAR_KIND.segment, color, 0, {
            flags,
            ...(dashed ? { dashOn: p.dash![0], dashOff: p.dash![1], dashStart: along } : {}),
          });
          along += Math.hypot(x1 - x0, y1 - y0);
        }
        break;
      }
      case "triangle": {
        const fill = resolve(p.fill);
        if (!(fill >>> 24)) break;
        reserve(pack, 1);
        const t = p.points;
        push(pack, p, t[0], t[1], t[2], t[3], t[4], t[5], 0, FAR_KIND.triangle, fill, 0);
        break;
      }
      case "runs": {
        const color = resolve(p.color);
        const r = p.runs;
        if (!(color >>> 24) || r.length < 3) break;
        reserve(pack, Math.floor(r.length / 3));
        const crisp = { flags: FAR_FLAG.crisp };
        for (let i = 0; i + 2 < r.length; i += 3) {
          push(
            pack,
            p,
            p.x + r[i]! * p.sx,
            p.y + r[i + 1]! * p.sy,
            r[i + 2]! * p.sx,
            p.sy,
            0,
            0,
            0,
            FAR_KIND.rect,
            color,
            0,
            crisp,
          );
        }
        break;
      }
      case "image": {
        if (!p.src || p.w <= 0 || p.h <= 0) break;
        reserve(pack, 1);
        pack.images.push({ index: pack.count, src: p.src });
        push(pack, p, p.x, p.y, p.w, p.h, 0, 0, 0, FAR_KIND.image, 0xffffffff, 0, {
          flags: FAR_FLAG.crisp,
          image: pack.images.length - 1,
        });
        break;
      }
      case "polygon": {
        const fill = resolve(p.fill);
        if (!(fill >>> 24) || p.points.length < 6) break;
        pack.polygons.push({ points: p.points, fill, ...(p.clip ? { clip: p.clip } : {}) });
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
          p,
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
          NONE,
          Math.min((p.minSize ?? 6) / p.size, p.maxZoom ?? NO_CLIP),
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
  pack.images = [];
  pack.polygons = [];
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
