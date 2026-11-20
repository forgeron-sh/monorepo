// The GPU view of a canvas: what an item looks like as plain primitives (boxes, ellipses, diamonds
// with solid or dither fills and dashed strokes, lines, triangles, runs of pixels, images, a line
// of text) in world units. The view asks each kind for them (`far.kinds` of `<Canvas>`) and draws
// them all on one surface (WebGL2, a 2D canvas without it): below the far zoom for every canvas
// that has a far view, at every zoom for one that asks for it (`far.overlay`). Packing them into
// instances is pure: the colours come from a resolver.

import { ellipsize, placeLine, type FarFont, type FarTextMetrics } from "./text";
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
  /**
   * Inner joints: `square` (by default) reach past them, a miter for right angles; `butt` meet end
   * to end, for a curve flattened (a joint reaching past would overlap a translucent stroke).
   */
  joins?: "square" | "butt";
  dash?: FarDash;
  /**
   * The dashes march along the line at this speed, world units a second (items flowing along a
   * running edge); still under reduced motion.
   */
  march?: number;
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
  /** Drawn as glyphs: the line box's height (1.25 × `size` by default), centred on `y`. */
  lineHeight?: number;
  /** Drawn as glyphs: `y` is the baseline (an SVG `<text>`), not the middle of the line. */
  baseline?: boolean;
}

/**
 * Lines of text laid out by the caller (`wrapText`), drawn as glyphs from an atlas in the order of
 * the other primitives, so what is drawn above a text hides it. Each line starts at its left end
 * `x`; `y` is the top of its line box, `lineHeight` high; the baseline sits where the DOM puts it.
 * Under `minSize` screen pixels of font size the lines are bars of their width (`greek`) or nothing.
 */
export interface FarGlyphs extends FarCommon {
  type: "glyphs";
  font: FarFont;
  color: FarColor;
  lineHeight: number;
  lines: ReadonlyArray<{ x: number; y: number; text: string }>;
  minSize?: number;
  greek?: boolean;
}

export type FarPrimitive =
  | FarGlyphs
  | FarShape
  | FarLine
  | FarTriangle
  | FarRuns
  | FarImage
  | FarPolygon
  | FarText;

/** Packed colour: `r | g << 8 | b << 16 | a << 24`, straight alpha. */
export type FarRgba = number;

/** Floats per instance in a packed buffer (100 bytes). */
export const FAR_STRIDE = 25;

/** The instance kinds, as the shader reads them. */
export const FAR_KIND = {
  rect: 0,
  ellipse: 1,
  diamond: 2,
  segment: 3,
  triangle: 4,
  image: 5,
  glyph: 6,
} as const;

/** Bits of an instance's flags (float 19). */
export const FAR_FLAG = { crisp: 1, chrome: 2, capStart: 4, capEnd: 8, march: 16 } as const;

const NO_CLIP = 1e30;

/**
 * Primitives packed as instances, one per shape, segment, triangle, run or image, in drawing order.
 * Layout of one instance (floats): `0–3` geometry (a box `x y w h`, a segment `x0 y0 x1 y1`, a
 * triangle's first two points), `4–7` (stroke or line width, 1 when that width is in screen
 * pixels, outset in screen pixels or the triangle's last point, kind), `8–9` the zoom range it
 * shows in, `10` fill and `11` stroke as packed colours, `12–15` the clip rectangle, `16–19` dash
 * on, dash off, where the dash pattern starts along the path, flags (`FAR_FLAG`), `20–23` the
 * pattern's bits, its pixel, the image's index in `images` (a marching line's speed), the
 * pattern's density, `24` the slot of the group the instance belongs to (`far-buffer.ts`: the
 * group's offset, so a moved item is not packed again; 0 in a plain pack). A glyph is
 * `0–3` its pen's x, the top of its line box, its font size and its id in the atlas
 * (`PackOptions.glyphs`), `4` its baseline below the line's top, its colour in `10`. The DOM puts
 * a line box's top on a device pixel of the page before scaling it, and so does the surface.
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
  /** The glyph ids the instances draw, each with the lowest zoom it is drawn from. */
  glyphs: Map<number, number>;
  /** Packed at `PackOptions.zoom`: the zooms it holds the right glyphs for, `[from, to)`. */
  band: [number, number];
  /** Some texts were left out for the glyph budget (`FarGlyphSource.budget`). */
  partial: boolean;
  /** Some lines march (`FarLine.march`): the surface draws again each frame while they show. */
  animated: boolean;
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
    glyphs: new Map(),
    band: [-Infinity, Infinity],
    partial: false,
    animated: false,
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
  /** Lays glyphs out and names them: without it, `glyphs` primitives draw nothing. */
  glyphs?: FarGlyphSource;
  /**
   * The zoom the pack is drawn at, if known: glyphs not drawn there are left out (a board seen from
   * far packs none of its words), and `pack.band` says when to pack again.
   */
  zoom?: number;
  /**
   * Glyphs still to lay out, shared by several packs (a layer packed group by group): each pack
   * takes from it; past it, texts are left out as with `FarGlyphSource.budget`.
   */
  budget?: { left: number };
}

/** The metrics of the fonts and the ids of their glyphs in the surface's atlas. */
export interface FarGlyphSource extends FarTextMetrics {
  /** A cluster of a font as a glyph id, the same for the same font and cluster. */
  id(font: FarFont, cluster: string): number;
  /**
   * Each `glyphs` primitive's instances once packed (their bits), copied when it comes again: a
   * board's words are laid out once per text, not once per pack. A new map when the fonts or the
   * colours change.
   */
  cache?: WeakMap<FarGlyphs, { data: Uint32Array; ids: ReadonlyMap<number, number> }>;
  /**
   * With `cache`: how many glyphs a pack lays out at most (the rest come from the cache); texts
   * past it are left out and the pack says it is `partial`, to be packed again a frame later. A
   * board seen whole crossing the zoom its words appear at gets them over a few frames.
   */
  budget?: number;
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
  /** A marching line's speed (float 22, where an image's index goes). */
  march?: number;
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
  d[o + 22] = extra.image ?? extra.march ?? -1;
  d[o + 23] = bits ? density(bits) : 0;
  d[o + 24] = 0;
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
  // Glyphs laid out by this call, against `glyphs.budget`.
  let laid = 0;
  for (const raw of prims) {
    // With glyphs, a one-line text is drawn as glyphs too, in the order of the rest.
    const p = raw.type === "text" && options.glyphs ? textAsGlyphs(raw, options.glyphs) : raw;
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
        const march = dashed && p.march ? p.march : 0;
        let along = 0;
        for (let i = 0; i < segs; i++) {
          const j = (i + 1) % n;
          const x0 = pts[i * 2]!;
          const y0 = pts[i * 2 + 1]!;
          const x1 = pts[j * 2]!;
          const y1 = pts[j * 2 + 1]!;
          // An end reaches past unless butt-ended; an inner joint unless the joins are butt.
          const flat = p.joins === "butt";
          const capStart = i === 0 && !p.closed ? !butt : !flat;
          const capEnd = i === segs - 1 && !p.closed ? !butt : !flat;
          const flags =
            (capStart ? FAR_FLAG.capStart : 0) |
            (capEnd ? FAR_FLAG.capEnd : 0) |
            (march ? FAR_FLAG.march : 0);
          push(pack, p, x0, y0, x1, y1, p.width, unit, 0, FAR_KIND.segment, color, 0, {
            flags,
            ...(dashed ? { dashOn: p.dash![0], dashOff: p.dash![1], dashStart: along } : {}),
            ...(march ? { march } : {}),
          });
          if (march) pack.animated = true;
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
      case "glyphs": {
        const g = options.glyphs;
        const color = resolve(p.color);
        if (!(color >>> 24) || !p.lines.length) break;
        const size = p.font.size;
        const from = Math.max(p.minZoom ?? 0, (p.minSize ?? 0) / size);
        const to = p.maxZoom ?? NO_CLIP;
        if (p.greek && g && from > (p.minZoom ?? 0)) {
          // Too small to read: a bar of each line's width, half the font's height, faded.
          const h = size * 0.5;
          const alpha = Math.round(((color >>> 24) & 0xff) * 0.35);
          const bar = ((color & 0xffffff) | (alpha << 24)) >>> 0;
          for (const line of p.lines) {
            if (!line.text) continue;
            const w = placeLine(g, p.font, line.text.replace(/ +$/, "")).width;
            reserve(pack, 1);
            const y = line.y + p.lineHeight / 2 - h / 2;
            push(
              pack,
              p,
              line.x,
              y,
              w,
              h,
              0,
              0,
              0,
              FAR_KIND.rect,
              bar,
              0,
              NONE,
              Math.min(from, to),
            );
          }
        }
        if (!g || from >= to) break;
        // At a known zoom, glyphs out of their range are left out: the pack says until which
        // zooms it holds (`band`), and is packed again past them.
        const zoom = options.zoom;
        if (zoom !== undefined) {
          for (const t of [from, to]) {
            if (t <= zoom) pack.band[0] = Math.max(pack.band[0], t);
            else pack.band[1] = Math.min(pack.band[1], t);
          }
          if (zoom < from || zoom >= to) break;
        }
        // Packed before (the same primitive, the same fonts and colours): its instances are copied.
        const cache = g.cache;
        const hit = cache?.get(p);
        if (hit) {
          const n = hit.data.length / FAR_STRIDE;
          reserve(pack, n);
          pack.colors.set(hit.data, pack.count * FAR_STRIDE);
          pack.count += n;
          for (const [id, z] of hit.ids) {
            const seen = pack.glyphs.get(id);
            if (seen === undefined || seen > z) pack.glyphs.set(id, z);
          }
          break;
        }
        if (cache && options.budget) {
          if (options.budget.left <= 0) {
            pack.partial = true;
            break;
          }
          for (const line of p.lines) options.budget.left -= line.text.length;
        } else if (cache && g.budget !== undefined) {
          if (laid >= g.budget) {
            pack.partial = true;
            break;
          }
          for (const line of p.lines) laid += line.text.length;
        }
        const first = pack.count;
        const ids = new Map<number, number>();
        const base = g.baseline(p.font, p.lineHeight);
        const span = { ...p, minZoom: from };
        for (const line of p.lines) {
          if (!line.text) continue;
          const placed = placeLine(g, p.font, line.text);
          reserve(pack, placed.clusters.length);
          for (let i = 0; i < placed.clusters.length; i++) {
            const c = placed.clusters[i]!;
            if (c.trim() === "") continue;
            const id = g.id(p.font, c);
            const seen = pack.glyphs.get(id);
            if (seen === undefined || seen > from) pack.glyphs.set(id, from);
            ids.set(id, from);
            const x = line.x + placed.xs[i]!;
            push(pack, span, x, line.y, size, id, base, 0, 0, FAR_KIND.glyph, color, 0);
          }
        }
        cache?.set(p, {
          data: pack.colors.slice(first * FAR_STRIDE, pack.count * FAR_STRIDE),
          ids,
        });
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

const asGlyphs = new WeakMap<FarText, { source: FarGlyphSource; glyphs: FarGlyphs }>();

/**
 * A one-line `text` as `glyphs`: its line cut with an ellipsis to `maxWidth`, in a line box 1.25
 * times its size centred on `y`, a bar under `minSize`. Kept per text and per glyph source.
 */
function textAsGlyphs(t: FarText, source: FarGlyphSource): FarGlyphs {
  const hit = asGlyphs.get(t);
  if (hit && hit.source === source) return hit.glyphs;
  // (`source` is the surface's, the same object until its fonts change.)
  const font: FarFont = {
    family: t.font ?? "sans",
    size: t.size,
    ...(t.weight !== undefined ? { weight: t.weight } : {}),
  };
  const lineHeight = t.lineHeight ?? t.size * 1.25;
  const text = t.maxWidth !== undefined ? ellipsize(source, font, t.text, t.maxWidth) : t.text;
  const top = t.baseline ? t.y - source.baseline(font, lineHeight) : t.y - lineHeight / 2;
  const glyphs: FarGlyphs = {
    type: "glyphs",
    font,
    color: t.color,
    lineHeight,
    lines: [{ x: t.x, y: top, text }],
    minSize: t.minSize ?? 6,
    greek: true,
    ...(t.clip ? { clip: t.clip } : {}),
    ...(t.minZoom !== undefined ? { minZoom: t.minZoom } : {}),
    ...(t.maxZoom !== undefined ? { maxZoom: t.maxZoom } : {}),
  };
  asGlyphs.set(t, { source, glyphs });
  return glyphs;
}

/** Empties a pack, keeping its memory. */
export function resetFarPack(pack: FarPack): FarPack {
  pack.count = 0;
  pack.texts = [];
  pack.images = [];
  pack.polygons = [];
  pack.glyphs = new Map();
  pack.band = [-Infinity, Infinity];
  pack.partial = false;
  pack.animated = false;
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
