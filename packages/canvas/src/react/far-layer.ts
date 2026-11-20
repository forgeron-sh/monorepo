// The GPU layer: every primitive of the GPU view on one surface under the DOM items. Each layer is a
// buffer kept per group (`core/far-buffer.ts`: an item's drawing, an edge): a change packs and
// uploads only the groups it touches, a group moved as a whole (a drag) only gets an offset, read
// by the shader from a small texture. WebGL2 draws the instances in one instanced call per layer
// and per run between images (a pan or a zoom sets three uniforms); a 2D canvas draws the same
// instances when WebGL2 is missing or its context is lost. Glyphs are instances too, sampled from
// an atlas (`glyph-atlas.ts`), so words lie in the order of the drawing; a one-line `text` is
// drawn as glyphs. Marching dashes move with a time uniform, a frame at a time while some show.

import {
  createFarBuffer,
  type FarBuffer,
  type FarBufferUpdate,
  type FarGroup,
} from "../core/far-buffer";
import {
  createFarPack,
  FAR_FLAG,
  FAR_KIND,
  FAR_STRIDE,
  packFar,
  parseCssColor,
  type FarColor,
  type FarGlyphs,
  type FarGlyphSource,
  type FarPack,
  type FarPrimitive,
  type FarRgba,
  type FarText,
  type PackOptions,
} from "../core/far";
import type { Size, Viewport } from "../core/types";
import { createGlyphAtlas, GLYPH_ROW, type GlyphAtlas } from "./glyph-atlas";
import { textMetrics } from "./text-metrics";

/** The layers of the GPU view, drawn in this order: under the items, the items, the chrome. */
export type FarLayerName = "below" | "items" | "chrome";
const LAYERS: ReadonlyArray<FarLayerName> = ["below", "items", "chrome"];

export interface FarLayer {
  /** A layer's primitives, as one group: packed when they change, never on a camera move. */
  set(layer: FarLayerName, prims: ReadonlyArray<FarPrimitive & { outset?: number }>): void;
  /**
   * A layer's groups in drawing order (an item's drawing each): only the groups that changed are
   * packed, a group moved as a whole is offset, not packed again (`far-buffer.ts`).
   */
  setGroups(layer: FarLayerName, groups: ReadonlyArray<FarGroup>): void;
  /** Draws with the camera of the moment. */
  draw(viewport: Viewport, size: Size): void;
  /** Shows or hides the surface; hidden, `draw` does nothing. */
  show(on: boolean): void;
  /** `webgl2`, or `2d` without it. */
  readonly mode: "webgl2" | "2d";
  destroy(): void;
}

/** Group offsets per row of the offsets texture. */
const OFFSET_ROW = 1024;

// The vertex shader turns one instance into a quad in device pixels, one pixel larger than what it
// covers; the fragment shader covers it by its signed distance, so edges are smooth at any zoom,
// and crisp boxes (`FAR_FLAG.crisp`) have their edges on whole device pixels, as SVG's crispEdges.
// A stroke or a line thinner than a device pixel is drawn one pixel wide at its share of the
// colour, as the DOM does. Strokes are inside the box, centred on the path SVG would stroke: the
// fill reaches that path, the stroke covers it, dashes run along it from where SVG starts it.
const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_g0;
layout(location = 1) in vec4 a_g1;
layout(location = 2) in vec2 a_zoom;
layout(location = 3) in vec4 a_fill;
layout(location = 4) in vec4 a_stroke;
layout(location = 5) in vec4 a_clip;
layout(location = 6) in vec4 a_dash;
layout(location = 7) in vec4 a_pat;
layout(location = 8) in float a_slot;
uniform vec3 u_view;
uniform float u_time;
uniform highp sampler2D u_offsets;
uniform vec2 u_size;
uniform float u_dpr;
uniform highp sampler2D u_glyphs;
out vec2 v_p;
out vec2 v_dev;
flat out vec4 v_a;
flat out vec4 v_b;
flat out vec4 v_fill;
flat out vec4 v_stroke;
flat out vec4 v_clip;
flat out vec4 v_dash;
flat out vec4 v_pat;
flat out float v_kind;
vec2 dev(vec2 w) { return (w * u_view.z + u_view.xy) * u_dpr; }
void main() {
  int corner = gl_VertexID % 6;
  vec2 q = vec2(
    (corner == 1 || corner == 4 || corner == 5) ? 1.0 : 0.0,
    (corner == 2 || corner == 3 || corner == 5) ? 1.0 : 0.0);
  float kind = a_g1.w;
  // The group's offset (a moved item that was not packed again), added to every position.
  int slot = int(a_slot + 0.5);
  vec2 off = texelFetch(u_offsets, ivec2(slot % ${OFFSET_ROW}, slot / ${OFFSET_ROW}), 0).xy;
  vec4 g0 = a_g0;
  vec4 g1 = a_g1;
  vec4 box = a_clip;
  g0.xy += off;
  box.xy += off;
  if (kind > 2.5 && kind < 4.5) g0.zw += off;
  if (kind > 3.5 && kind < 4.5) g1.xy += off;
  int flags = int(a_dash.w + 0.5);
  v_kind = kind;
  v_fill = a_fill;
  v_stroke = a_stroke;
  v_pat = a_pat;
  v_a = vec4(0.0);
  v_b = vec4(0.0);
  v_p = vec2(0.0);
  if (u_view.z < a_zoom.x || u_view.z >= a_zoom.y) {
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    v_dev = vec2(0.0);
    v_clip = vec4(0.0);
    v_dash = vec4(0.0);
    return;
  }
  float scale = u_view.z * u_dpr;
  float unit = g1.y > 0.5 ? u_dpr : scale;
  float march = (flags & ${FAR_FLAG.march}) != 0 ? a_pat.z * u_time : 0.0;
  v_dash = vec4(a_dash.xy * unit, (a_dash.z - march) * unit, a_dash.w);
  vec2 pos;
  if (kind > 5.5) {
    // A glyph: its cell in the atlas. Rasterised at this very size, it lands on whole device
    // pixels at the quarter-pixel phase of its pen, as the DOM's text does; another size of it
    // (the zoom is moving) is scaled until this one is ready.
    int id = int(g0.w + 0.5);
    ivec2 at = ivec2((id % ${GLYPH_ROW}) * 8, id / ${GLYPH_ROW});
    vec4 info = texelFetch(u_glyphs, at + ivec2(4, 0), 0);
    if (info.w < 0.5) {
      gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
      v_dev = vec2(0.0);
      v_clip = vec4(0.0);
      return;
    }
    // The line's top on a device pixel of the unscaled page, as the DOM lays it out.
    vec2 o = dev(vec2(g0.x, floor(g0.y * u_dpr + 0.5) / u_dpr + g1.x));
    float k = g0.z * scale / info.z;
    vec4 r;
    vec2 p0;
    vec2 sz;
    if (abs(k - 1.0) < 1e-4) {
      float qx = floor(o.x * info.w + 0.5) / info.w;
      float ix = floor(qx);
      int phase = min(int((qx - ix) * info.w + 0.5), int(info.w + 0.5) - 1);
      r = texelFetch(u_glyphs, at + ivec2(phase, 0), 0);
      p0 = vec2(ix, floor(o.y + 0.5)) + info.xy;
      sz = r.zw;
    } else {
      r = texelFetch(u_glyphs, at, 0);
      p0 = o + info.xy * k;
      sz = r.zw * k;
    }
    pos = p0 + q * sz;
    v_p = r.xy + q * r.zw;
  } else if (kind < 2.5 || kind > 4.5) {
    vec2 p0;
    vec2 p1;
    if ((flags & ${FAR_FLAG.chrome}) != 0) {
      vec2 s0 = floor(g0.xy * u_view.z + u_view.xy + 0.5);
      vec2 sz = floor(g0.zw * u_view.z + 0.5);
      p0 = (s0 - floor(g1.z)) * u_dpr;
      p1 = (s0 + sz + ceil(g1.z)) * u_dpr;
    } else {
      p0 = dev(g0.xy) - g1.z * u_dpr;
      p1 = dev(g0.xy + g0.zw) + g1.z * u_dpr;
      if ((flags & ${FAR_FLAG.crisp}) != 0) {
        // On whole device pixels, unless the box is under one: then it is covered by its share.
        vec2 big = vec2(greaterThanEqual(p1 - p0, vec2(1.0)));
        p0 = mix(p0, floor(p0 + 0.5), big);
        p1 = mix(p1, floor(p1 + 0.5), big);
      }
    }
    float sw = kind > 4.5 ? 0.0 : g1.x * unit;
    float share = 1.0;
    if (sw > 0.0 && sw < 1.0) { share = sw; sw = 1.0; }
    else if (sw > 0.0 && (flags & ${FAR_FLAG.crisp | FAR_FLAG.chrome}) != 0) sw = floor(sw + 0.5);
    vec2 c = (p0 + p1) * 0.5;
    vec2 h = (p1 - p0) * 0.5;
    vec2 local = (q * 2.0 - 1.0) * (h + 1.0);
    pos = c + local;
    v_p = local;
    v_a = vec4(h, sw, share);
  } else if (kind < 3.5) {
    vec2 a = dev(g0.xy);
    vec2 b = dev(g0.zw);
    float w = g1.x * unit;
    float cover = 1.0;
    if (w < 1.0) { cover = max(w, 0.0); w = 1.0; }
    vec2 d = b - a;
    float len = length(d);
    vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float hw = w * 0.5;
    float e0 = (flags & ${FAR_FLAG.capStart}) != 0 ? hw : 0.0;
    float e1 = (flags & ${FAR_FLAG.capEnd}) != 0 ? hw : 0.0;
    float along = mix(-e0 - 1.0, len + e1 + 1.0, q.x);
    float across = (q.y * 2.0 - 1.0) * (hw + 1.0);
    pos = a + dir * along + nrm * across;
    v_p = vec2(along, across);
    v_a = vec4(len, hw, e0, e1);
    v_b = vec4(cover, 0.0, 0.0, 0.0);
  } else {
    vec2 p0 = dev(g0.xy);
    vec2 p1 = dev(g0.zw);
    vec2 p2 = dev(g1.xy);
    vec2 lo = min(p0, min(p1, p2)) - 1.0;
    vec2 hi = max(p0, max(p1, p2)) + 1.0;
    pos = mix(lo, hi, q);
    v_a = vec4(p0, p1);
    v_b = vec4(p2, 0.0, 0.0);
  }
  v_clip = vec4(floor(dev(box.xy) + 0.5), floor(dev(box.xy + box.zw) + 0.5));
  v_dev = pos;
  vec2 clip = pos / (u_size * u_dpr) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_p;
in vec2 v_dev;
flat in vec4 v_a;
flat in vec4 v_b;
flat in vec4 v_fill;
flat in vec4 v_stroke;
flat in vec4 v_clip;
flat in vec4 v_dash;
flat in vec4 v_pat;
flat in float v_kind;
uniform vec3 u_view;
uniform float u_dpr;
uniform sampler2D u_image;
uniform sampler2D u_atlas;
uniform vec2 u_atlasSize;
uniform bool u_stencil;
out vec4 o;
float cov(float d) { return clamp(0.5 - d, 0.0, 1.0); }
float dashCov(float s) {
  float on = v_dash.x;
  float off = v_dash.y;
  if (on <= 0.0 || off <= 0.0) return 1.0;
  float period = on + off;
  float m = mod(s + v_dash.z, period);
  float inside = m < on ? min(m, on - m) : -min(m - on, period - m);
  return clamp(inside + 0.5, 0.0, 1.0);
}
float pattern() {
  if (v_pat.x < 0.5) return 1.0;
  if (v_pat.y * u_view.z * u_dpr < 1.0) return v_pat.w;
  vec2 world = (v_dev / u_dpr - u_view.xy) / u_view.z;
  vec2 cell = mod(floor(world / v_pat.y), 4.0);
  int bit = int(cell.y) * 4 + int(cell.x);
  return float((int(v_pat.x + 0.5) >> bit) & 1);
}
float rectArc(vec2 p, vec2 hc) {
  float dt = abs(p.y + hc.y);
  float dr = abs(p.x - hc.x);
  float db = abs(p.y - hc.y);
  float dl = abs(p.x + hc.x);
  float m = min(min(dt, dr), min(db, dl));
  if (m == dt) return p.x + hc.x;
  if (m == dr) return 2.0 * hc.x + p.y + hc.y;
  if (m == db) return 3.0 * hc.x + 2.0 * hc.y - p.x;
  return 4.0 * hc.x + 3.0 * hc.y - p.y;
}
float ellipseArc(vec2 p, vec2 r) {
  float t = atan(p.y * r.x, p.x * r.y);
  if (t < 0.0) t += 6.28318531;
  float step_ = t / 16.0;
  float sum = 0.0;
  for (int i = 0; i <= 16; i++) {
    float u = step_ * float(i);
    float f = length(vec2(r.x * sin(u), r.y * cos(u)));
    sum += (i == 0 || i == 16 ? 1.0 : (i % 2 == 1 ? 4.0 : 2.0)) * f;
  }
  return sum * step_ / 3.0;
}
float diamondArc(vec2 p, vec2 hc) {
  float len = length(hc);
  vec2 a;
  vec2 b;
  float base;
  if (p.x >= 0.0 && p.y < 0.0) { a = vec2(0.0, -hc.y); b = vec2(hc.x, 0.0); base = 0.0; }
  else if (p.x >= 0.0) { a = vec2(hc.x, 0.0); b = vec2(0.0, hc.y); base = len; }
  else if (p.y >= 0.0) { a = vec2(0.0, hc.y); b = vec2(-hc.x, 0.0); base = 2.0 * len; }
  else { a = vec2(-hc.x, 0.0); b = vec2(0.0, -hc.y); base = 3.0 * len; }
  return base + dot(p - a, (b - a) / max(len, 1e-3));
}
float sdEllipse(vec2 p, vec2 h) {
  float k0 = length(p / h);
  float k1 = length(p / (h * h));
  return k1 > 0.0 ? k0 * (k0 - 1.0) / k1 : -min(h.x, h.y);
}
float sdDiamond(vec2 p, vec2 h) {
  vec2 a = abs(p);
  return (a.x / h.x + a.y / h.y - 1.0) / length(1.0 / h);
}
float sdTriangle(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
  vec2 e0 = p1 - p0;
  vec2 e1 = p2 - p1;
  vec2 e2 = p0 - p2;
  vec2 v0 = p - p0;
  vec2 v1 = p - p1;
  vec2 v2 = p - p2;
  vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / max(dot(e0, e0), 1e-6), 0.0, 1.0);
  vec2 q1 = v1 - e1 * clamp(dot(v1, e1) / max(dot(e1, e1), 1e-6), 0.0, 1.0);
  vec2 q2 = v2 - e2 * clamp(dot(v2, e2) / max(dot(e2, e2), 1e-6), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)),
                   vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))),
                   vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
void main() {
  if (v_dev.x < v_clip.x || v_dev.y < v_clip.y || v_dev.x > v_clip.z || v_dev.y > v_clip.w) discard;
  float kind = v_kind;
  if (kind > 5.5) {
    float a = texture(u_atlas, v_p / u_atlasSize).a * v_fill.a;
    o = vec4(v_fill.rgb * a, a);
    return;
  }
  if (kind > 4.5) {
    vec2 h = max(v_a.xy, vec2(1e-3));
    float c = cov(abs(v_p.x) - h.x) * cov(abs(v_p.y) - h.y);
    o = texture(u_image, clamp((v_p + h) / (2.0 * h), 0.0, 1.0)) * c;
    return;
  }
  if (kind > 3.5) {
    float c = cov(sdTriangle(v_dev, v_a.xy, v_a.zw, v_b.xy));
    if (u_stencil) {
      if (c < 0.5) discard;
      o = vec4(0.0);
      return;
    }
    float a = c * v_fill.a;
    o = vec4(v_fill.rgb * a, a);
    return;
  }
  if (kind > 2.5) {
    float along = max(-(v_p.x + v_a.z), v_p.x - (v_a.x + v_a.w));
    float a = cov(along) * cov(abs(v_p.y) - v_a.y) * v_b.x * dashCov(v_p.x) * v_fill.a;
    o = vec4(v_fill.rgb * a, a);
    return;
  }
  vec2 h = max(v_a.xy, vec2(1e-3));
  float sw = v_a.z;
  bool dashed = sw > 0.0 && v_dash.x > 0.0;
  float fillCov;
  float strokeCov = 0.0;
  float s = 0.0;
  vec2 hc = sw > 0.0 ? max(h - sw * 0.5, vec2(1e-3)) : h;
  if (kind < 0.5) {
    vec2 ap = abs(v_p);
    fillCov = cov(ap.x - hc.x) * cov(ap.y - hc.y);
    if (sw > 0.0) {
      vec2 hi = max(h - sw, vec2(0.0));
      float outer = cov(ap.x - h.x) * cov(ap.y - h.y);
      float inner = cov(ap.x - hi.x) * cov(ap.y - hi.y);
      strokeCov = max(outer - inner, 0.0);
      if (dashed) s = rectArc(v_p, hc);
    }
  } else if (kind < 1.5) {
    float d = sdEllipse(v_p, hc);
    fillCov = cov(d);
    if (sw > 0.0) {
      strokeCov = cov(abs(d) - sw * 0.5);
      if (dashed) s = ellipseArc(v_p, hc);
    }
  } else {
    float d = sdDiamond(v_p, hc);
    fillCov = cov(d);
    if (sw > 0.0) {
      strokeCov = cov(abs(d) - sw * 0.5);
      if (dashed) s = diamondArc(v_p, hc);
    }
  }
  if (dashed) strokeCov *= dashCov(s);
  strokeCov *= v_a.w * v_stroke.a;
  float fa = fillCov * v_fill.a * pattern();
  vec3 rgb = v_stroke.rgb * strokeCov + v_fill.rgb * fa * (1.0 - strokeCov);
  float a = strokeCov + fa * (1.0 - strokeCov);
  o = vec4(rgb, a);
}`;

/**
 * Compiles and links the program. A local helper rather than `linkProgram` of `@forgeron/shaders`:
 * canvas does not depend on shaders, and twenty lines do not justify the dependency.
 */
function program(gl: WebGL2RenderingContext): WebGLProgram {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error("far layer: no shader (context lost?)");
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(`far layer: ${gl.getShaderInfoLog(s) ?? "shader"}`);
    return s;
  };
  const p = gl.createProgram();
  if (!p) throw new Error("far layer: no program (context lost?)");
  gl.attachShader(p, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(`far layer: ${gl.getProgramInfoLog(p) ?? "link"}`);
  return p;
}

interface GlBuffer {
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  /** Bytes the buffer holds. */
  capacity: number;
  /** The groups' offsets (`RG32F`, `OFFSET_ROW` a row) and the rows it holds; -1 before. */
  offsets: WebGLTexture;
  offsetRows: number;
}

interface GlState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  u: {
    view: WebGLUniformLocation | null;
    size: WebGLUniformLocation | null;
    dpr: WebGLUniformLocation | null;
    image: WebGLUniformLocation | null;
    stencil: WebGLUniformLocation | null;
    atlas: WebGLUniformLocation | null;
    atlasSize: WebGLUniformLocation | null;
    glyphs: WebGLUniformLocation | null;
    offsets: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
  };
  /** The glyphs' pixels (alpha) and where each glyph is in them (a float table). */
  atlas: WebGLTexture;
  glyphs: WebGLTexture;
  /** Rows the glyph table texture holds; -1 before its first upload. */
  glyphRows: number;
  /** The atlas texture holds pixels (it is allocated). */
  atlasReady: boolean;
  layers: Record<FarLayerName, GlBuffer>;
  /** A small buffer for the polygons' triangles and covers. */
  scratch: GlBuffer;
  /** What `u_image` samples when no image is drawn. */
  blank: WebGLTexture;
}

/** Points the instance attributes of the bound buffer at instance `first`. */
function pointAttributes(gl: WebGL2RenderingContext, first: number) {
  const stride = FAR_STRIDE * 4;
  const base = first * stride;
  const attr = (loc: number, size: number, type: number, norm: boolean, offset: number) =>
    gl.vertexAttribPointer(loc, size, type, norm, stride, base + offset);
  attr(0, 4, gl.FLOAT, false, 0);
  attr(1, 4, gl.FLOAT, false, 16);
  attr(2, 2, gl.FLOAT, false, 32);
  attr(3, 4, gl.UNSIGNED_BYTE, true, 40);
  attr(4, 4, gl.UNSIGNED_BYTE, true, 44);
  attr(5, 4, gl.FLOAT, false, 48);
  attr(6, 4, gl.FLOAT, false, 64);
  attr(7, 4, gl.FLOAT, false, 80);
  attr(8, 1, gl.FLOAT, false, 96);
}

function initGl(canvas: HTMLCanvasElement): GlState | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      // The shapes and lines cover their pixels by distance: no multisampling to pay for. The
      // stencil fills polygons (a lasso) of any shape.
      antialias: false,
      premultipliedAlpha: true,
      alpha: true,
      depth: false,
      stencil: true,
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  try {
    const prog = program(gl);
    const make = (): GlBuffer => {
      const vao = gl.createVertexArray()!;
      const buffer = gl.createBuffer()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      for (let loc = 0; loc < 9; loc++) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribDivisor(loc, 1);
      }
      pointAttributes(gl, 0);
      gl.bindVertexArray(null);
      const offsets = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, offsets);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return { vao, buffer, capacity: 0, offsets, offsetRows: -1 };
    };
    const blank = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    const texture = (filter: number) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const atlas = texture(gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    const glyphs = texture(gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(4));
    return {
      gl,
      program: prog,
      u: {
        view: gl.getUniformLocation(prog, "u_view"),
        size: gl.getUniformLocation(prog, "u_size"),
        dpr: gl.getUniformLocation(prog, "u_dpr"),
        image: gl.getUniformLocation(prog, "u_image"),
        stencil: gl.getUniformLocation(prog, "u_stencil"),
        atlas: gl.getUniformLocation(prog, "u_atlas"),
        atlasSize: gl.getUniformLocation(prog, "u_atlasSize"),
        glyphs: gl.getUniformLocation(prog, "u_glyphs"),
        offsets: gl.getUniformLocation(prog, "u_offsets"),
        time: gl.getUniformLocation(prog, "u_time"),
      },
      atlas,
      glyphs,
      glyphRows: -1,
      atlasReady: false,
      layers: { below: make(), items: make(), chrome: make() },
      scratch: make(),
      blank,
    };
  } catch {
    return null;
  }
}

/** Uploads `data` to a buffer, growing it when it is too small. */
function upload(gl: WebGL2RenderingContext, b: GlBuffer, data: Float32Array) {
  gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
  if (data.byteLength > b.capacity) {
    const bytes = Math.max(data.byteLength, b.capacity * 2, FAR_STRIDE * 4 * 64);
    gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW);
    b.capacity = bytes;
  }
  if (data.byteLength) gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
}

const css = (c: FarRgba) =>
  `rgba(${c & 0xff},${(c >>> 8) & 0xff},${(c >>> 16) & 0xff},${((c >>> 24) & 0xff) / 255})`;

/** The pixels of a pattern tile (4 × 4, lit cells in the colour), for the 2D canvas. */
function patternTile(doc: Document, bits: number, color: string): HTMLCanvasElement {
  const tile = doc.createElement("canvas");
  tile.width = tile.height = 4;
  const c = tile.getContext("2d");
  if (c) {
    c.fillStyle = color;
    for (let i = 0; i < 16; i++) if (bits & (1 << i)) c.fillRect(i % 4, Math.floor(i / 4), 1, 1);
  }
  return tile;
}

interface Draw2dContext {
  ctx: CanvasRenderingContext2D;
  v: Viewport;
  dpr: number;
  color: (c: FarRgba) => string;
  pattern: (bits: number, fill: FarRgba) => CanvasPattern | null;
  image: (src: string) => CanvasImageSource | null;
  /** A glyph's CSS font at `px` pixels and its cluster. */
  glyph: (id: number, px: number) => { font: string; text: string } | null;
  /** The group offsets of the `i`th pack. */
  offsets: (i: number) => Float32Array;
  /** Seconds marching dashes have marched. */
  time: number;
}

/** The same instances on a 2D canvas: slower per frame, for when WebGL2 is not there. */
function draw2d(packs: ReadonlyArray<FarPack>, k: Draw2dContext) {
  const { ctx, v, dpr, color } = k;
  const z = v.zoom;
  const px = 1 / dpr;
  // The offset of the instance's group (a moved item not packed again).
  let ox = 0;
  let oy = 0;
  const sx = (x: number) => (x + ox) * z + v.x;
  const sy = (y: number) => (y + oy) * z + v.y;
  const snap = (n: number) => Math.round(n * dpr) / dpr;
  for (const [index, pack] of packs.entries()) {
    const offsets = k.offsets(index);
    ox = 0;
    oy = 0;
    for (const poly of pack.polygons) {
      const pts = poly.points;
      ctx.beginPath();
      ctx.moveTo(sx(pts[0]!), sy(pts[1]!));
      for (let i = 2; i + 1 < pts.length; i += 2) ctx.lineTo(sx(pts[i]!), sy(pts[i + 1]!));
      ctx.closePath();
      ctx.fillStyle = color(poly.fill);
      ctx.fill("evenodd");
    }
    const d = pack.data;
    const u = pack.colors;
    for (let i = 0; i < pack.count; i++) {
      const o = i * FAR_STRIDE;
      if (z < d[o + 8]! || z >= d[o + 9]!) continue;
      const slot = d[o + 24]!;
      ox = offsets[slot * 2] ?? 0;
      oy = offsets[slot * 2 + 1] ?? 0;
      const kind = d[o + 7]!;
      const flags = d[o + 19]!;
      const unit = d[o + 5]! > 0.5 ? 1 : z;
      const clipped = d[o + 14]! < 1e29;
      if (clipped) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx(d[o + 12]!), sy(d[o + 13]!), d[o + 14]! * z, d[o + 15]! * z);
        ctx.clip();
      }
      const dash = d[o + 16]! > 0 && d[o + 17]! > 0;
      if (kind === FAR_KIND.glyph) {
        // The same glyph, drawn by the same rasteriser at its pen.
        const g = k.glyph(d[o + 3]!, d[o + 2]! * z);
        if (g) {
          if (ctx.font !== g.font) ctx.font = g.font;
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = color(u[o + 10]!);
          const top = Math.round((d[o + 1]! + oy) * dpr) / dpr - oy;
          ctx.fillText(g.text, sx(d[o]!), sy(top + d[o + 4]!));
        }
        if (clipped) ctx.restore();
        continue;
      }
      if (kind === FAR_KIND.segment) {
        let w = d[o + 4]! * unit;
        let alpha = 1;
        if (w < px) {
          alpha = w / px;
          w = px;
        }
        const x0 = sx(d[o]!);
        const y0 = sy(d[o + 1]!);
        const x1 = sx(d[o + 2]!);
        const y1 = sy(d[o + 3]!);
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const ux = (x1 - x0) / len;
        const uy = (y1 - y0) / len;
        const e0 = flags & FAR_FLAG.capStart ? w / 2 : 0;
        const e1 = flags & FAR_FLAG.capEnd ? w / 2 : 0;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color(u[o + 10]!);
        ctx.lineWidth = w;
        ctx.lineCap = "butt";
        if (dash) {
          ctx.setLineDash([d[o + 16]! * unit, d[o + 17]! * unit]);
          const march = flags & FAR_FLAG.march ? d[o + 22]! * k.time : 0;
          ctx.lineDashOffset = (d[o + 18]! - march) * unit - e0;
        }
        ctx.beginPath();
        ctx.moveTo(x0 - ux * e0, y0 - uy * e0);
        ctx.lineTo(x1 + ux * e1, y1 + uy * e1);
        ctx.stroke();
        if (dash) ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      } else if (kind === FAR_KIND.triangle) {
        ctx.fillStyle = color(u[o + 10]!);
        ctx.beginPath();
        ctx.moveTo(sx(d[o]!), sy(d[o + 1]!));
        ctx.lineTo(sx(d[o + 2]!), sy(d[o + 3]!));
        ctx.lineTo(sx(d[o + 4]!), sy(d[o + 5]!));
        ctx.fill();
      } else {
        const out = d[o + 6]!;
        let x: number;
        let y: number;
        let w: number;
        let h: number;
        if (flags & FAR_FLAG.chrome) {
          x = Math.round(sx(d[o]!)) - Math.floor(out);
          y = Math.round(sy(d[o + 1]!)) - Math.floor(out);
          w = Math.round(d[o + 2]! * z) + Math.floor(out) + Math.ceil(out);
          h = Math.round(d[o + 3]! * z) + Math.floor(out) + Math.ceil(out);
        } else {
          x = sx(d[o]!) - out;
          y = sy(d[o + 1]!) - out;
          w = d[o + 2]! * z + out * 2;
          h = d[o + 3]! * z + out * 2;
          if (flags & FAR_FLAG.crisp && w >= px && h >= px) {
            const x1 = snap(x + w);
            const y1 = snap(y + h);
            x = snap(x);
            y = snap(y);
            w = x1 - x;
            h = y1 - y;
          }
        }
        if (kind === FAR_KIND.image) {
          const img = k.image(pack.images[d[o + 22]!]?.src ?? "");
          if (img) ctx.drawImage(img, x, y, w, h);
          if (clipped) ctx.restore();
          continue;
        }
        const sw0 = d[o + 4]! * unit;
        const sw = u[o + 11]! ? sw0 : 0;
        const path = (inset: number) => {
          const ix = x + inset;
          const iy = y + inset;
          const iw = Math.max(0, w - inset * 2);
          const ih = Math.max(0, h - inset * 2);
          ctx.beginPath();
          if (kind === FAR_KIND.ellipse)
            ctx.ellipse(ix + iw / 2, iy + ih / 2, iw / 2, ih / 2, 0, 0, Math.PI * 2);
          else if (kind === FAR_KIND.diamond) {
            ctx.moveTo(ix + iw / 2, iy);
            ctx.lineTo(ix + iw, iy + ih / 2);
            ctx.lineTo(ix + iw / 2, iy + ih);
            ctx.lineTo(ix, iy + ih / 2);
            ctx.closePath();
          } else ctx.rect(ix, iy, iw, ih);
        };
        const fill = u[o + 10]!;
        if (fill >>> 24) {
          const bits = d[o + 20]!;
          const cell = d[o + 21]! * z;
          let style: string | CanvasPattern | null = color(fill);
          if (bits && cell * dpr >= 1) style = k.pattern(bits, fill);
          else if (bits) ctx.globalAlpha = d[o + 23]!;
          if (style && typeof style !== "string") {
            // The tile's cells on the world's pattern grid, anchored at the world's origin.
            style.setTransform?.(new DOMMatrix([cell, 0, 0, cell, v.x, v.y]));
          }
          if (style) {
            ctx.fillStyle = style;
            path(sw / 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        if (sw > 0) {
          const lw = Math.max(sw, px);
          ctx.globalAlpha = sw / lw;
          ctx.strokeStyle = color(u[o + 11]!);
          ctx.lineWidth = lw;
          ctx.lineJoin = "miter";
          if (dash) ctx.setLineDash([d[o + 16]! * unit, d[o + 17]! * unit]);
          path(lw / 2);
          ctx.stroke();
          if (dash) ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      }
      if (clipped) ctx.restore();
    }
  }
}

/**
 * Creates the far layer in `host` (the canvas's layer under its DOM items): a WebGL2 canvas, or a
 * 2D one. Colours are resolved on `host`, so a theme scoped to the editor applies, and again when
 * the page's theme changes.
 */
export function createFarLayer(host: HTMLElement): FarLayer {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  let canvas = doc.createElement("canvas");
  canvas.className = "fg-canvas-far";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  let gl = initGl(canvas);
  let ctx2d: CanvasRenderingContext2D | null = null;
  const metrics = textMetrics(host);
  // A glyph's cells go straight to the texture of the WebGL2 surface (the 2D one draws text).
  const toTexture = (x: number, y: number, w: number, h: number, source: HTMLCanvasElement) => {
    const s = gl;
    if (!s) return;
    const g = s.gl;
    g.bindTexture(g.TEXTURE_2D, s.atlas);
    if (!s.atlasReady || atlas.dirty.cleared) {
      const n = atlas.size;
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, n, n, 0, g.RGBA, g.UNSIGNED_BYTE, null);
      s.atlasReady = true;
      atlas.dirty.cleared = false;
    }
    // The run's pixels only: uploading the canvas itself would copy all of it each time.
    const c = source.getContext("2d", { willReadFrequently: true });
    const img = c?.getImageData(0, 0, w, h);
    if (img) g.texSubImage2D(g.TEXTURE_2D, 0, x, y, w, h, g.RGBA, g.UNSIGNED_BYTE, img.data);
  };
  const atlas: GlyphAtlas = createGlyphAtlas(host, metrics, toTexture);
  /** Glyphs laid out per pack at most: the rest a frame later. */
  const GLYPHS_PER_PACK = 3000;
  // Packed words, by primitive: dropped with the fonts or the theme's colours.
  let glyphCache = new WeakMap<
    FarGlyphs,
    { data: Uint32Array; ids: ReadonlyMap<number, number> }
  >();
  const colorStrings = new Map<number, string>();

  const fallback = () => {
    // A canvas that had a WebGL context cannot give a 2D one: a new element takes its place.
    const next = doc.createElement("canvas");
    next.className = canvas.className;
    next.setAttribute("aria-hidden", "true");
    next.style.display = canvas.style.display;
    canvas.replaceWith(next);
    canvas = next;
    gl = null;
    for (const img of images.values()) img.texture = null;
    ctx2d = canvas.getContext("2d");
    atlas.reset();
    sized = "";
  };
  if (!gl) ctx2d = canvas.getContext("2d");

  const onLost = (e: Event) => {
    e.preventDefault();
    fallback();
    redraw();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  /* ---- colours */

  const probe = doc.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.display = "none";
  host.append(probe);
  let palette = new Map<FarColor, FarRgba>();
  let scratch: CanvasRenderingContext2D | null | undefined;
  const resolve = (c: FarColor): FarRgba => {
    let v = palette.get(c);
    if (v !== undefined) return v;
    probe.style.color = "";
    probe.style.color = c.startsWith("--") ? `var(${c})` : c;
    const computed = win?.getComputedStyle(probe).color ?? "";
    let packed = parseCssColor(computed);
    if (packed === null) {
      // Another colour space (oklch…): let a 2D canvas convert it.
      if (scratch === undefined) {
        const s = doc.createElement("canvas");
        s.width = s.height = 1;
        scratch = s.getContext("2d", { willReadFrequently: true });
      }
      packed = 0;
      if (scratch) {
        scratch.clearRect(0, 0, 1, 1);
        scratch.fillStyle = computed;
        scratch.fillRect(0, 0, 1, 1);
        const [r = 0, g = 0, b = 0, a = 0] = scratch.getImageData(0, 0, 1, 1).data;
        packed = (r | (g << 8) | (b << 16) | (a << 24)) >>> 0;
      }
    }
    palette.set(c, packed);
    return packed;
  };

  /* ---- text */

  let fonts: { sans: string; mono: string } | null = null;
  const fontOf = (t: FarText, size: number) => {
    fonts ??= (() => {
      const s = win?.getComputedStyle(host);
      return {
        sans: s?.getPropertyValue("--font-sans").trim() || "ui-sans-serif, system-ui, sans-serif",
        mono: s?.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace",
      };
    })();
    return `${t.weight ?? 400} ${size}px ${t.font === "mono" ? fonts.mono : fonts.sans}`;
  };
  let measurer: CanvasRenderingContext2D | null | undefined;
  const widths = new Map<string, number>();
  const ctxForText = () => {
    if (measurer === undefined) measurer = doc.createElement("canvas").getContext("2d");
    return measurer;
  };
  const measure = (t: FarText) => {
    const key = `${t.font}|${t.weight}|${t.size}|${t.text}`;
    let w = widths.get(key);
    if (w === undefined) {
      const m = ctxForText();
      if (m) m.font = fontOf(t, t.size);
      w = m ? m.measureText(t.text).width : t.text.length * t.size * 0.55;
      widths.set(key, w);
    }
    return w;
  };
  /* ---- layers: each a buffer of groups, packed per group (`far-buffer.ts`) */

  const buffers: Record<FarLayerName, FarBuffer> = {
    below: createFarBuffer(),
    items: createFarBuffer(),
    chrome: createFarBuffer(),
  };
  const packs: Record<FarLayerName, FarPack> = {
    below: buffers.below.pack,
    items: buffers.items.pack,
    chrome: buffers.chrome.pack,
  };
  /** What each layer still has to upload: every instance, ranges of them, offsets. */
  interface Pending {
    full: boolean;
    ranges: Array<[number, number]>;
    offsets: [number, number] | null;
  }
  const pending: Record<FarLayerName, Pending> = {
    below: { full: true, ranges: [], offsets: [0, 0] },
    items: { full: true, ranges: [], offsets: [0, 0] },
    chrome: { full: true, ranges: [], offsets: [0, 0] },
  };
  const note = (layer: FarLayerName, u: FarBufferUpdate) => {
    const p = pending[layer];
    if (u.full) {
      p.full = true;
      p.ranges.length = 0;
    } else if (!p.full) for (const r of u.ranges) p.ranges.push(r);
    if (u.offsets) {
      p.offsets = p.offsets
        ? [Math.min(p.offsets[0], u.offsets[0]), Math.max(p.offsets[1], u.offsets[1])]
        : u.offsets;
    }
  };
  // The metrics and ids of the glyphs, one object until the fonts or the colours change (a text
  // drawn as glyphs is kept per source).
  let glyphs: FarGlyphSource | null = null;
  const glyphSourceNow = (): FarGlyphSource | null => {
    if (!metrics) return null;
    glyphs ??= {
      advance: metrics.advance,
      kern: metrics.kern,
      baseline: metrics.baseline,
      id: atlas.id,
      cache: glyphCache,
    };
    return glyphs;
  };
  const options = (): PackOptions => {
    const g = glyphSourceNow();
    return {
      resolve,
      measure,
      ...(last ? { zoom: last.viewport.zoom } : {}),
      ...(g ? { glyphs: g, budget: { left: GLYPHS_PER_PACK } } : {}),
    };
  };

  let visible = false;
  let sized = "";
  let again = 0;
  let last: { viewport: Viewport; size: Size } | null = null;

  const sizeTo = (el: HTMLCanvasElement, size: Size, dpr: number) => {
    const w = Math.max(1, Math.round(size.w * dpr));
    const h = Math.max(1, Math.round(size.h * dpr));
    if (el.width !== w || el.height !== h) {
      el.width = w;
      el.height = h;
    }
  };

  const colorString = (c: FarRgba) => {
    let style = colorStrings.get(c);
    if (!style) {
      style = css(c);
      colorStrings.set(c, style);
    }
    return style;
  };
  const patterns = new Map<string, CanvasPattern | null>();

  /* ---- images: loaded when first drawn, uploaded once they have loaded */

  interface LoadedImage {
    el: HTMLImageElement;
    ready: boolean;
    texture: WebGLTexture | null;
  }
  const images = new Map<string, LoadedImage>();
  const imageOf = (src: string): LoadedImage => {
    let img = images.get(src);
    if (!img) {
      const el = new Image();
      const entry: LoadedImage = { el, ready: false, texture: null };
      el.decoding = "async";
      el.onload = () => {
        entry.ready = true;
        redraw();
      };
      el.src = src;
      images.set(src, entry);
      img = entry;
    }
    return img;
  };
  const textureOf = (g: WebGL2RenderingContext, src: string): WebGLTexture | null => {
    const img = imageOf(src);
    if (!img.ready) return null;
    if (img.texture) return img.texture;
    const t = g.createTexture();
    if (!t) return null;
    g.bindTexture(g.TEXTURE_2D, t);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    try {
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img.el);
    } catch {
      g.deleteTexture(t);
      return null;
    }
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    img.texture = t;
    return t;
  };

  /* ---- WebGL2 */

  /** A polygon filled through the stencil: its fan inverts the stencil, a cover paints the odd. */
  const fillPolygon = (s: GlState, poly: FarPack["polygons"][number]) => {
    const g = s.gl;
    const pts = poly.points;
    const n = Math.floor(pts.length / 2);
    const tmp = createFarPack(n);
    const fan: FarPrimitive[] = [];
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      x0 = Math.min(x0, pts[i * 2]!);
      y0 = Math.min(y0, pts[i * 2 + 1]!);
      x1 = Math.max(x1, pts[i * 2]!);
      y1 = Math.max(y1, pts[i * 2 + 1]!);
      if (i < 1 || i + 1 >= n) continue;
      fan.push({
        type: "triangle",
        points: [pts[0]!, pts[1]!, pts[i * 2]!, pts[i * 2 + 1]!, pts[i * 2 + 2]!, pts[i * 2 + 3]!],
        fill: "#000",
      });
    }
    const clip = poly.clip ? { clip: poly.clip } : {};
    fan.push({ type: "rect", x: x0, y: y0, w: x1 - x0, h: y1 - y0, fill: "#000", ...clip });
    packFar(tmp, fan, { resolve: () => poly.fill });
    upload(g, s.scratch, tmp.data.subarray(0, tmp.count * FAR_STRIDE));
    g.bindVertexArray(s.scratch.vao);
    pointAttributes(g, 0);
    g.enable(g.STENCIL_TEST);
    g.colorMask(false, false, false, false);
    g.stencilFunc(g.ALWAYS, 0, 0xff);
    g.stencilOp(g.KEEP, g.KEEP, g.INVERT);
    g.uniform1i(s.u.stencil, 1);
    g.drawArraysInstanced(g.TRIANGLES, 0, 6, tmp.count - 1);
    g.uniform1i(s.u.stencil, 0);
    g.colorMask(true, true, true, true);
    g.stencilFunc(g.NOTEQUAL, 0, 0xff);
    g.stencilOp(g.ZERO, g.ZERO, g.ZERO);
    pointAttributes(g, tmp.count - 1);
    g.drawArraysInstanced(g.TRIANGLES, 0, 6, 1);
    g.disable(g.STENCIL_TEST);
  };

  /* ---- glyphs: rasterised for the zoom of the moment, exactly once it rests */

  let lastZoom = Number.NaN;
  let movedAt = 0;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  let more = 0;
  const SETTLE_MS = 150;
  /** Milliseconds of rasterising glyphs a frame at most. */
  const GLYPH_BUDGET = 2;
  /** Fills the atlas for this frame; asks for another frame while some is left. */
  const prepareGlyphs = (viewport: Viewport, dpr: number) => {
    const now = performance.now();
    if (viewport.zoom !== lastZoom) {
      lastZoom = viewport.zoom;
      movedAt = now;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        settleTimer = null;
        redraw();
      }, SETTLE_MS);
    }
    const settled = now - movedAt >= SETTLE_MS - 5;
    let needed: Map<number, number> | null = null;
    for (const layer of LAYERS) {
      const ids = packs[layer].glyphs;
      if (!ids.size) continue;
      if (!needed) needed = ids;
      else {
        if (needed === packs.below.glyphs || needed === packs.items.glyphs)
          needed = new Map(needed);
        for (const [id, z] of ids) if ((needed.get(id) ?? Infinity) > z) needed.set(id, z);
      }
    }
    if (!needed) return;
    const left = atlas.prepare(needed, viewport.zoom, viewport.zoom * dpr, settled, GLYPH_BUDGET);
    if (left && !more)
      more =
        win?.requestAnimationFrame(() => {
          more = 0;
          redraw();
        }) ?? 0;
  };

  const uploadGlyphs = (s: GlState) => {
    const g = s.gl;
    const dirty = atlas.dirty;
    if (dirty.cleared && s.atlasReady) {
      // Started again with nothing drawn yet: transparent.
      const n = atlas.size;
      g.bindTexture(g.TEXTURE_2D, s.atlas);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, n, n, 0, g.RGBA, g.UNSIGNED_BYTE, null);
      dirty.cleared = false;
    }
    const rows = atlas.rows;
    const width = GLYPH_ROW * 8;
    g.bindTexture(g.TEXTURE_2D, s.glyphs);
    if (rows !== s.glyphRows) {
      g.texImage2D(
        g.TEXTURE_2D,
        0,
        g.RGBA32F,
        width,
        rows,
        0,
        g.RGBA,
        g.FLOAT,
        atlas.table.subarray(0, width * rows * 4),
      );
      s.glyphRows = rows;
    } else {
      for (const r of dirty.rows) {
        if (r >= rows) continue;
        g.texSubImage2D(
          g.TEXTURE_2D,
          0,
          0,
          r,
          width,
          1,
          g.RGBA,
          g.FLOAT,
          atlas.table.subarray(r * width * 4, (r + 1) * width * 4),
        );
      }
    }
    atlas.clean();
  };

  const drawGl = (s: GlState, viewport: Viewport, size: Size, dpr: number) => {
    const g = s.gl;
    prepareGlyphs(viewport, dpr);
    uploadGlyphs(s);
    g.viewport(0, 0, canvas.width, canvas.height);
    g.clearColor(0, 0, 0, 0);
    g.clearStencil(0);
    g.clear(g.COLOR_BUFFER_BIT | g.STENCIL_BUFFER_BIT);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
    g.useProgram(s.program);
    g.uniform3f(s.u.view, viewport.x, viewport.y, viewport.zoom);
    g.uniform2f(s.u.size, size.w, size.h);
    g.uniform1f(s.u.dpr, dpr);
    g.uniform1i(s.u.stencil, 0);
    g.activeTexture(g.TEXTURE1);
    g.bindTexture(g.TEXTURE_2D, s.atlas);
    g.uniform1i(s.u.atlas, 1);
    g.uniform2f(s.u.atlasSize, atlas.size, atlas.size);
    g.activeTexture(g.TEXTURE2);
    g.bindTexture(g.TEXTURE_2D, s.glyphs);
    g.uniform1i(s.u.glyphs, 2);
    g.activeTexture(g.TEXTURE0);
    g.uniform1i(s.u.image, 0);
    g.bindTexture(g.TEXTURE_2D, s.blank);
    g.uniform1f(s.u.time, marchTime());
    g.uniform1i(s.u.offsets, 3);
    for (const layer of LAYERS) {
      const pack = packs[layer];
      const l = s.layers[layer];
      uploadLayer(s, l, layer);
      g.activeTexture(g.TEXTURE3);
      g.bindTexture(g.TEXTURE_2D, s.blank);
      g.activeTexture(g.TEXTURE0);
      for (const poly of pack.polygons) fillPolygon(s, poly);
      if (!pack.count) continue;
      g.activeTexture(g.TEXTURE3);
      g.bindTexture(g.TEXTURE_2D, l.offsets);
      g.activeTexture(g.TEXTURE0);
      g.bindVertexArray(l.vao);
      g.bindBuffer(g.ARRAY_BUFFER, l.buffer);
      // One call per run between images: each image binds its texture.
      let from = 0;
      const run = (to: number) => {
        if (to <= from) return;
        pointAttributes(g, from);
        g.drawArraysInstanced(g.TRIANGLES, 0, 6, to - from);
      };
      for (const img of pack.images) {
        const z0 = pack.data[img.index * FAR_STRIDE + 8]!;
        const z1 = pack.data[img.index * FAR_STRIDE + 9]!;
        if (viewport.zoom < z0 || viewport.zoom >= z1) continue;
        run(img.index);
        from = img.index + 1;
        const t = textureOf(g, img.src);
        if (!t) continue;
        g.bindTexture(g.TEXTURE_2D, t);
        pointAttributes(g, img.index);
        g.drawArraysInstanced(g.TRIANGLES, 0, 6, 1);
        g.bindTexture(g.TEXTURE_2D, s.blank);
      }
      run(pack.count);
      if (from) pointAttributes(g, 0);
    }
    g.bindVertexArray(null);
  };

  /** Uploads what a layer changed: its instances (all, or the ranges), its groups' offsets. */
  const uploadLayer = (s: GlState, l: GlBuffer, layer: FarLayerName) => {
    const g = s.gl;
    const p = pending[layer];
    const pack = packs[layer];
    const bytes = pack.count * FAR_STRIDE * 4;
    if (p.full || bytes > l.capacity) {
      upload(g, l, pack.data.subarray(0, pack.count * FAR_STRIDE));
    } else if (p.ranges.length) {
      g.bindBuffer(g.ARRAY_BUFFER, l.buffer);
      let ranges = p.ranges;
      if (ranges.length > 32) {
        // Many small writes cost more than one span.
        let lo = Infinity;
        let hi = -Infinity;
        for (const [a, b] of ranges) {
          lo = Math.min(lo, a);
          hi = Math.max(hi, b);
        }
        ranges = [[lo, hi]];
      }
      for (const [a, b] of ranges) {
        const to = Math.min(b, pack.count);
        if (to <= a) continue;
        g.bufferSubData(
          g.ARRAY_BUFFER,
          a * FAR_STRIDE * 4,
          pack.data.subarray(a * FAR_STRIDE, to * FAR_STRIDE),
        );
      }
    }
    p.full = false;
    p.ranges.length = 0;
    const buffer = buffers[layer];
    const rows = Math.max(1, Math.ceil(buffer.slots / OFFSET_ROW));
    if (p.offsets || rows !== l.offsetRows) {
      g.activeTexture(g.TEXTURE3);
      g.bindTexture(g.TEXTURE_2D, l.offsets);
      const table = buffer.offsets;
      const need = rows * OFFSET_ROW * 2;
      const data =
        table.length >= need
          ? table.subarray(0, need)
          : (() => {
              const t = new Float32Array(need);
              t.set(table.subarray(0, Math.min(table.length, need)));
              return t;
            })();
      if (rows !== l.offsetRows) {
        g.texImage2D(g.TEXTURE_2D, 0, g.RG32F, OFFSET_ROW, rows, 0, g.RG, g.FLOAT, data);
        l.offsetRows = rows;
      } else if (p.offsets) {
        const r0 = Math.floor(p.offsets[0] / OFFSET_ROW);
        const r1 = Math.min(rows, Math.ceil(p.offsets[1] / OFFSET_ROW));
        if (r1 > r0)
          g.texSubImage2D(
            g.TEXTURE_2D,
            0,
            0,
            r0,
            OFFSET_ROW,
            r1 - r0,
            g.RG,
            g.FLOAT,
            data.subarray(r0 * OFFSET_ROW * 2, r1 * OFFSET_ROW * 2),
          );
      }
      g.activeTexture(g.TEXTURE0);
      p.offsets = null;
    }
  };

  /* ---- marching dashes: the time they march by, a frame at a time while some show */

  const still =
    typeof win?.matchMedia === "function"
      ? win.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const t0 = performance.now();
  /** Seconds, wrapped every ten minutes so the shader's floats keep their precision. */
  const marchTime = () => (still?.matches ? 0 : ((performance.now() - t0) / 1000) % 600);
  let ticking = 0;
  const tick = () => {
    const animated = visible && !still?.matches && LAYERS.some((l) => packs[l].animated);
    if (!animated || ticking) return;
    ticking =
      win?.requestAnimationFrame(() => {
        ticking = 0;
        redraw();
      }) ?? 0;
  };

  const repackAll = () => {
    glyphs = null;
    const o = options();
    for (const layer of LAYERS) note(layer, buffers[layer].repackAll(o));
  };

  const draw = (viewport: Viewport, size: Size) => {
    last = { viewport, size };
    // Words come in or go out of their zoom range, or were left for the budget: the groups that
    // hold them are packed again (copies, mostly), and only them.
    let partial = false;
    for (const layer of LAYERS) {
      const pack = packs[layer];
      const band = pack.band;
      if (viewport.zoom < band[0] || viewport.zoom >= band[1])
        note(layer, buffers[layer].refresh({ ...options(), budget: { left: GLYPHS_PER_PACK } }));
      partial ||= pack.partial;
    }
    // Words left out for the budget: packed again next frame, with more of them laid out.
    if (partial && !again)
      again =
        win?.requestAnimationFrame(() => {
          again = 0;
          const o = options();
          for (const layer of LAYERS)
            if (packs[layer].partial) note(layer, buffers[layer].refresh(o));
          redraw();
        }) ?? 0;
    if (!visible || !size.w || !size.h) return;
    const dpr = win?.devicePixelRatio || 1;
    const key = `${size.w}x${size.h}@${dpr}`;
    if (key !== sized) {
      sizeTo(canvas, size, dpr);
      sized = key;
    }
    if (gl) drawGl(gl, viewport, size, dpr);
    else if (ctx2d) {
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.imageSmoothingEnabled = true;
      draw2d([packs.below, packs.items, packs.chrome], {
        ctx: ctx2d,
        v: viewport,
        dpr,
        color: colorString,
        pattern: (bits, fill) => {
          const key = `${bits}|${fill}`;
          let p = patterns.get(key);
          if (p === undefined) {
            p = ctx2d?.createPattern(patternTile(doc, bits, colorString(fill)), "repeat") ?? null;
            patterns.set(key, p);
          }
          return p;
        },
        image: (src) => {
          const img = imageOf(src);
          return img.ready ? img.el : null;
        },
        glyph: (id, px) =>
          metrics ? { font: metrics.css(atlas.font(id), px), text: atlas.cluster(id) } : null,
        offsets: (layer) => buffers[LAYERS[layer]!].offsets,
        time: marchTime(),
      });
    }
    tick();
  };
  const redraw = () => {
    if (last) draw(last.viewport, last.size);
  };

  /* ---- theme */

  const refresh = () => {
    palette = new Map();
    glyphCache = new WeakMap();
    fonts = null;
    patterns.clear();
    repackAll();
    redraw();
  };
  // A font has loaded: glyphs move and look different.
  const unsubscribe = metrics?.subscribe(() => {
    atlas.reset();
    glyphCache = new WeakMap();
    repackAll();
    redraw();
  });
  const observer = typeof MutationObserver === "undefined" ? null : new MutationObserver(refresh);
  observer?.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class", "style"],
  });
  const media =
    typeof win?.matchMedia === "function" ? win.matchMedia("(prefers-color-scheme: dark)") : null;
  media?.addEventListener?.("change", refresh);

  const show = (on: boolean) => {
    visible = on;
    canvas.style.display = on ? "" : "none";
  };
  show(false);

  return {
    get mode() {
      return gl ? "webgl2" : "2d";
    },
    set(layer, prims) {
      note(layer, buffers[layer].update([{ key: "", prims }], options()));
    },
    setGroups(layer, groups) {
      note(layer, buffers[layer].update(groups, options()));
    },
    draw,
    show,
    destroy() {
      unsubscribe?.();
      if (settleTimer) clearTimeout(settleTimer);
      if (more) win?.cancelAnimationFrame(more);
      if (again) win?.cancelAnimationFrame(again);
      if (ticking) win?.cancelAnimationFrame(ticking);
      observer?.disconnect();
      media?.removeEventListener?.("change", refresh);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (gl) {
        const g = gl.gl;
        for (const l of [...Object.values(gl.layers), gl.scratch]) {
          g.deleteBuffer(l.buffer);
          g.deleteVertexArray(l.vao);
          g.deleteTexture(l.offsets);
        }
        for (const img of images.values()) if (img.texture) g.deleteTexture(img.texture);
        g.deleteTexture(gl.blank);
        g.deleteTexture(gl.atlas);
        g.deleteTexture(gl.glyphs);
        g.deleteProgram(gl.program);
      }
      canvas.remove();
      atlas.destroy();
      probe.remove();
      gl = null;
      ctx2d = null;
    },
  };
}
