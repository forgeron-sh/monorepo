// The far layer: every primitive of the far view on one surface under the DOM items. WebGL2 draws
// the packed instances in one instanced call per layer (a pan or a zoom sets three uniforms); a 2D
// canvas draws the same instances when WebGL2 is missing or its context is lost. Texts big enough
// to read go on a 2D canvas above it, redrawn with the camera only while there are some.

import {
  createFarPack,
  FAR_KIND,
  FAR_STRIDE,
  packFar,
  parseCssColor,
  resetFarPack,
  type FarColor,
  type FarPack,
  type FarPrimitive,
  type FarRgba,
  type FarText,
} from "../core/far";
import type { Size, Viewport } from "../core/types";

/** The layers of the far view, drawn in this order. */
export type FarLayerName = "below" | "items";

export interface FarLayer {
  /** Packs a layer's primitives: when they change, never on a camera move. */
  set(layer: FarLayerName, prims: Iterable<FarPrimitive & { outset?: number }>): void;
  /** Draws with the camera of the moment. */
  draw(viewport: Viewport, size: Size): void;
  /** Shows or hides the surface; hidden, `draw` does nothing. */
  show(on: boolean): void;
  /** `webgl2`, or `2d` without it. */
  readonly mode: "webgl2" | "2d";
  destroy(): void;
}

// The vertex shader turns one instance into a quad (or a triangle) in screen pixels; the fragment
// shader covers it by its signed distance, so edges are smooth at any zoom, and a stroke or a line
// thinner than a device pixel is drawn one pixel wide at its share of the colour, as the DOM does.
const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_g0;
layout(location = 1) in vec4 a_g1;
layout(location = 2) in vec2 a_zoom;
layout(location = 3) in vec4 a_fill;
layout(location = 4) in vec4 a_stroke;
layout(location = 5) in vec4 a_clip;
uniform vec3 u_view;
uniform vec2 u_size;
uniform float u_dpr;
out vec2 v_p;
out vec4 v_box;
out vec4 v_fill;
out vec4 v_stroke;
out vec4 v_clip;
out vec2 v_screen;
vec2 screen(vec2 w) { return w * u_view.z + u_view.xy; }
void main() {
  int corner = gl_VertexID % 6;
  vec2 q = vec2(
    (corner == 1 || corner == 4 || corner == 5) ? 1.0 : 0.0,
    (corner == 2 || corner == 3 || corner == 5) ? 1.0 : 0.0);
  float kind = a_g1.w;
  float px = 1.0 / u_dpr;
  vec2 pos = vec2(-10.0);
  v_fill = a_fill;
  v_stroke = a_stroke;
  v_p = vec2(0.0);
  v_box = vec4(0.0, 0.0, 0.0, kind);
  if (u_view.z < a_zoom.x || u_view.z >= a_zoom.y) {
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    return;
  }
  if (kind < 2.5) {
    vec2 size = a_g0.zw * u_view.z;
    vec2 half_ = size * 0.5 + a_g1.z;
    vec2 c = screen(a_g0.xy) + size * 0.5;
    vec2 local = (q * 2.0 - 1.0) * (half_ + px);
    pos = c + local;
    v_p = local;
    float sw = a_g1.y > 0.5 ? a_g1.x : a_g1.x * u_view.z;
    v_box = vec4(half_, sw, kind);
  } else if (kind < 3.5) {
    vec2 a = screen(a_g0.xy);
    vec2 b = screen(a_g0.zw);
    float w = a_g1.y > 0.5 ? a_g1.x : a_g1.x * u_view.z;
    float cover = 1.0;
    if (w < px) { cover = w / px; w = px; }
    vec2 d = b - a;
    float len = length(d);
    vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float hw = w * 0.5;
    float ext = hw + px;
    float along = mix(-ext, len + ext, q.x);
    float across = (q.y * 2.0 - 1.0) * ext;
    pos = a + dir * along + nrm * across;
    v_p = vec2(along - len * 0.5, across);
    v_box = vec4(len * 0.5 + hw, hw, cover, kind);
  } else {
    vec2 p0 = screen(a_g0.xy);
    vec2 p1 = screen(a_g0.zw);
    vec2 p2 = screen(a_g1.xy);
    pos = corner == 1 ? p1 : corner == 2 ? p2 : p0;
  }
  vec2 c0 = screen(a_clip.xy);
  v_clip = vec4(c0, c0 + a_clip.zw * u_view.z);
  v_screen = pos;
  vec2 clip = pos / u_size * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_p;
in vec4 v_box;
in vec4 v_fill;
in vec4 v_stroke;
in vec4 v_clip;
in vec2 v_screen;
uniform float u_dpr;
out vec4 o;
float boxDist(vec2 p, vec2 h) {
  vec2 d = abs(p) - h;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
void main() {
  if (v_screen.x < v_clip.x || v_screen.y < v_clip.y || v_screen.x > v_clip.z || v_screen.y > v_clip.w) discard;
  float kind = v_box.w;
  float px = 1.0 / u_dpr;
  if (kind > 3.5) {
    o = vec4(v_fill.rgb * v_fill.a, v_fill.a);
    return;
  }
  if (kind > 2.5) {
    float a = clamp(0.5 - boxDist(v_p, v_box.xy) / px, 0.0, 1.0) * v_box.z * v_fill.a;
    o = vec4(v_fill.rgb * a, a);
    return;
  }
  vec2 h = max(v_box.xy, vec2(1e-3));
  float dist;
  if (kind < 0.5) {
    dist = boxDist(v_p, h);
  } else if (kind < 1.5) {
    float k0 = length(v_p / h);
    float k1 = length(v_p / (h * h));
    dist = k1 > 0.0 ? k0 * (k0 - 1.0) / k1 : -min(h.x, h.y);
  } else {
    vec2 p = abs(v_p);
    dist = (p.x / h.x + p.y / h.y - 1.0) / length(1.0 / h);
  }
  float inside = clamp(0.5 - dist / px, 0.0, 1.0);
  float fillA = v_fill.a * inside;
  float strokeA = 0.0;
  float sw = v_box.z;
  if (sw > 0.0 && v_stroke.a > 0.0) {
    float w = max(sw, px);
    float inner = clamp(0.5 - (dist + w) / px, 0.0, 1.0);
    strokeA = (inside - inner) * (sw / w) * v_stroke.a;
  }
  vec3 rgb = v_stroke.rgb * strokeA + v_fill.rgb * fillA * (1.0 - strokeA);
  float a = strokeA + fillA * (1.0 - strokeA);
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

interface GlState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  u: {
    view: WebGLUniformLocation | null;
    size: WebGLUniformLocation | null;
    dpr: WebGLUniformLocation | null;
  };
  layers: Record<
    FarLayerName,
    { vao: WebGLVertexArrayObject; buffer: WebGLBuffer; uploaded: number }
  >;
}

function initGl(canvas: HTMLCanvasElement): GlState | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      // The shapes and lines cover their pixels by distance: no multisampling to pay for.
      antialias: false,
      premultipliedAlpha: true,
      alpha: true,
      depth: false,
      stencil: false,
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  try {
    const prog = program(gl);
    const make = () => {
      const vao = gl.createVertexArray()!;
      const buffer = gl.createBuffer()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const stride = FAR_STRIDE * 4;
      const attr = (loc: number, size: number, type: number, norm: boolean, offset: number) => {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, type, norm, stride, offset);
        gl.vertexAttribDivisor(loc, 1);
      };
      attr(0, 4, gl.FLOAT, false, 0);
      attr(1, 4, gl.FLOAT, false, 16);
      attr(2, 2, gl.FLOAT, false, 32);
      attr(3, 4, gl.UNSIGNED_BYTE, true, 40);
      attr(4, 4, gl.UNSIGNED_BYTE, true, 44);
      attr(5, 4, gl.FLOAT, false, 48);
      gl.bindVertexArray(null);
      return { vao, buffer, uploaded: -1 };
    };
    return {
      gl,
      program: prog,
      u: {
        view: gl.getUniformLocation(prog, "u_view"),
        size: gl.getUniformLocation(prog, "u_size"),
        dpr: gl.getUniformLocation(prog, "u_dpr"),
      },
      layers: { below: make(), items: make() },
    };
  } catch {
    return null;
  }
}

const css = (c: FarRgba) =>
  `rgba(${c & 0xff},${(c >>> 8) & 0xff},${(c >>> 16) & 0xff},${((c >>> 24) & 0xff) / 255})`;

/** The same instances on a 2D canvas: slower per frame, for when WebGL2 is not there. */
function draw2d(
  ctx: CanvasRenderingContext2D,
  packs: ReadonlyArray<FarPack>,
  v: Viewport,
  dpr: number,
  colors: Map<number, string>,
) {
  const color = (c: FarRgba) => {
    let s = colors.get(c);
    if (!s) {
      s = css(c);
      colors.set(c, s);
    }
    return s;
  };
  const z = v.zoom;
  const px = 1 / dpr;
  for (const pack of packs) {
    const d = pack.data;
    const u = pack.colors;
    for (let i = 0; i < pack.count; i++) {
      const o = i * FAR_STRIDE;
      if (z < d[o + 8]! || z >= d[o + 9]!) continue;
      const kind = d[o + 7]!;
      const clipped = d[o + 14]! < 1e29;
      if (clipped) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(d[o + 12]! * z + v.x, d[o + 13]! * z + v.y, d[o + 14]! * z, d[o + 15]! * z);
        ctx.clip();
      }
      if (kind === FAR_KIND.segment) {
        let w = d[o + 5]! > 0.5 ? d[o + 4]! : d[o + 4]! * z;
        let alpha = 1;
        if (w < px) {
          alpha = w / px;
          w = px;
        }
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color(u[o + 10]!);
        ctx.lineWidth = w;
        ctx.lineCap = "square";
        ctx.beginPath();
        ctx.moveTo(d[o]! * z + v.x, d[o + 1]! * z + v.y);
        ctx.lineTo(d[o + 2]! * z + v.x, d[o + 3]! * z + v.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (kind === FAR_KIND.triangle) {
        ctx.fillStyle = color(u[o + 10]!);
        ctx.beginPath();
        ctx.moveTo(d[o]! * z + v.x, d[o + 1]! * z + v.y);
        ctx.lineTo(d[o + 2]! * z + v.x, d[o + 3]! * z + v.y);
        ctx.lineTo(d[o + 4]! * z + v.x, d[o + 5]! * z + v.y);
        ctx.fill();
      } else {
        const out = d[o + 6]!;
        const x = d[o]! * z + v.x - out;
        const y = d[o + 1]! * z + v.y - out;
        const w = d[o + 2]! * z + out * 2;
        const h = d[o + 3]! * z + out * 2;
        const path = () => {
          ctx.beginPath();
          if (kind === FAR_KIND.ellipse)
            ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          else if (kind === FAR_KIND.diamond) {
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h / 2);
            ctx.lineTo(x + w / 2, y + h);
            ctx.lineTo(x, y + h / 2);
            ctx.closePath();
          } else ctx.rect(x, y, w, h);
        };
        const fill = u[o + 10]!;
        const stroke = u[o + 11]!;
        if (fill) {
          ctx.fillStyle = color(fill);
          path();
          ctx.fill();
        }
        if (stroke) {
          const sw = d[o + 5]! > 0.5 ? d[o + 4]! : d[o + 4]! * z;
          const lw = Math.max(sw, px);
          ctx.globalAlpha = sw / lw;
          ctx.strokeStyle = color(stroke);
          ctx.lineWidth = lw;
          ctx.save();
          path();
          ctx.clip();
          ctx.lineWidth = lw * 2;
          ctx.stroke();
          ctx.restore();
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
  let text: HTMLCanvasElement | null = null;
  host.append(canvas);
  let gl = initGl(canvas);
  let ctx2d: CanvasRenderingContext2D | null = null;
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
    ctx2d = canvas.getContext("2d");
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
  const fitted = new Map<string, string>();
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
  /** The text cut with an ellipsis to its width, measured once at its world size. */
  const fit = (t: FarText) => {
    if (t.maxWidth === undefined || measure(t) <= t.maxWidth) return t.text;
    const key = `${t.font}|${t.weight}|${t.size}|${t.maxWidth}|${t.text}`;
    let s = fitted.get(key);
    if (s === undefined) {
      const m = ctxForText();
      s = t.text;
      if (m) {
        m.font = fontOf(t, t.size);
        let lo = 0;
        let hi = t.text.length;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (m.measureText(`${t.text.slice(0, mid)}…`).width <= t.maxWidth) lo = mid;
          else hi = mid - 1;
        }
        s = `${t.text.slice(0, lo)}…`;
      }
      fitted.set(key, s);
    }
    return s;
  };

  /* ---- layers */

  const packs: Record<FarLayerName, FarPack> = { below: createFarPack(), items: createFarPack() };
  const sources: Record<FarLayerName, Array<FarPrimitive & { outset?: number }>> = {
    below: [],
    items: [],
  };
  let version = 0;
  const uploaded: Record<FarLayerName, number> = { below: -1, items: -1 };
  const versions: Record<FarLayerName, number> = { below: 0, items: 0 };
  const repack = (layer: FarLayerName) => {
    packFar(resetFarPack(packs[layer]), sources[layer], { resolve, measure });
    versions[layer] = ++version;
  };

  let visible = false;
  let sized = "";
  let last: { viewport: Viewport; size: Size } | null = null;

  const sizeTo = (el: HTMLCanvasElement, size: Size, dpr: number) => {
    const w = Math.max(1, Math.round(size.w * dpr));
    const h = Math.max(1, Math.round(size.h * dpr));
    if (el.width !== w || el.height !== h) {
      el.width = w;
      el.height = h;
    }
  };

  // The texts are drawn on a canvas a margin larger than the view: a pan within the margin moves
  // it (a CSS transform), a zoom or a longer pan draws it again.
  const MARGIN = 128;
  let textAt: { viewport: Viewport; size: Size; dpr: number; version: number } | null = null;
  const drawTexts = (v: Viewport, size: Size, dpr: number) => {
    let any = false;
    for (const layer of ["below", "items"] as const) {
      for (const t of packs[layer].texts) {
        if (t.size * v.zoom >= (t.minSize ?? 6)) {
          any = true;
          break;
        }
      }
    }
    if (!any) {
      if (text) text.style.display = "none";
      textAt = null;
      return;
    }
    if (!text) {
      text = doc.createElement("canvas");
      text.className = "fg-canvas-far fg-canvas-far-text";
      text.setAttribute("aria-hidden", "true");
      text.style.inset = "auto";
      text.style.left = `${-MARGIN}px`;
      text.style.top = `${-MARGIN}px`;
      canvas.after(text);
    }
    text.style.display = "";
    const at = textAt;
    if (
      at &&
      at.viewport.zoom === v.zoom &&
      at.dpr === dpr &&
      at.version === version &&
      at.size.w === size.w &&
      at.size.h === size.h &&
      Math.abs(v.x - at.viewport.x) <= MARGIN &&
      Math.abs(v.y - at.viewport.y) <= MARGIN
    ) {
      text.style.transform = `translate(${v.x - at.viewport.x}px, ${v.y - at.viewport.y}px)`;
      return;
    }
    textAt = { viewport: v, size, dpr, version };
    text.style.transform = "";
    const full = { w: size.w + MARGIN * 2, h: size.h + MARGIN * 2 };
    text.style.width = `${full.w}px`;
    text.style.height = `${full.h}px`;
    sizeTo(text, full, dpr);
    const c = text.getContext("2d");
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, text.width, text.height);
    c.setTransform(dpr, 0, 0, dpr, MARGIN * dpr, MARGIN * dpr);
    c.textBaseline = "middle";
    const x0 = (-v.x - MARGIN) / v.zoom;
    const y0 = (-v.y - MARGIN) / v.zoom;
    const x1 = x0 + full.w / v.zoom;
    const y1 = y0 + full.h / v.zoom;
    let font = "";
    let fill = "";
    for (const layer of ["below", "items"] as const) {
      for (const t of packs[layer].texts) {
        const px = t.size * v.zoom;
        if (px < (t.minSize ?? 6)) continue;
        if (t.y + t.size < y0 || t.y - t.size > y1 || t.x > x1) continue;
        if (t.x + (t.maxWidth ?? measure(t)) < x0) continue;
        const f = fontOf(t, px);
        if (f !== font) {
          c.font = f;
          font = f;
        }
        const color = resolve(t.color);
        let style = colorStrings.get(color);
        if (!style) {
          style = css(color);
          colorStrings.set(color, style);
        }
        if (style !== fill) {
          c.fillStyle = style;
          fill = style;
        }
        const x = t.x * v.zoom + v.x;
        const y = t.y * v.zoom + v.y;
        if (t.clip) {
          c.save();
          c.beginPath();
          c.rect(
            t.clip.x * v.zoom + v.x,
            t.clip.y * v.zoom + v.y,
            t.clip.w * v.zoom,
            t.clip.h * v.zoom,
          );
          c.clip();
          c.fillText(fit(t), x, y);
          c.restore();
        } else c.fillText(fit(t), x, y);
      }
    }
  };

  const draw = (viewport: Viewport, size: Size) => {
    last = { viewport, size };
    if (!visible || !size.w || !size.h) return;
    const dpr = win?.devicePixelRatio || 1;
    const key = `${size.w}x${size.h}@${dpr}`;
    if (key !== sized) {
      sizeTo(canvas, size, dpr);
      sized = key;
    }
    if (gl) {
      const g = gl.gl;
      g.viewport(0, 0, canvas.width, canvas.height);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      g.enable(g.BLEND);
      g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      g.useProgram(gl.program);
      g.uniform3f(gl.u.view, viewport.x, viewport.y, viewport.zoom);
      g.uniform2f(gl.u.size, size.w, size.h);
      g.uniform1f(gl.u.dpr, dpr);
      for (const layer of ["below", "items"] as const) {
        const pack = packs[layer];
        const l = gl.layers[layer];
        if (uploaded[layer] !== versions[layer]) {
          g.bindBuffer(g.ARRAY_BUFFER, l.buffer);
          g.bufferData(
            g.ARRAY_BUFFER,
            pack.data.subarray(0, pack.count * FAR_STRIDE),
            g.DYNAMIC_DRAW,
          );
          uploaded[layer] = versions[layer];
        }
        if (!pack.count) continue;
        g.bindVertexArray(l.vao);
        g.drawArraysInstanced(g.TRIANGLES, 0, 6, pack.count);
      }
      g.bindVertexArray(null);
    } else if (ctx2d) {
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw2d(ctx2d, [packs.below, packs.items], viewport, dpr, colorStrings);
    }
    drawTexts(viewport, size, dpr);
  };
  const redraw = () => {
    if (last) draw(last.viewport, last.size);
  };

  /* ---- theme */

  const refresh = () => {
    palette = new Map();
    fonts = null;
    repack("below");
    repack("items");
    redraw();
  };
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
    if (!on && text) text.style.display = "none";
  };
  show(false);

  return {
    get mode() {
      return gl ? "webgl2" : "2d";
    },
    set(layer, prims) {
      sources[layer] = [...prims];
      repack(layer);
    },
    draw,
    show,
    destroy() {
      observer?.disconnect();
      media?.removeEventListener?.("change", refresh);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (gl) {
        const g = gl.gl;
        for (const l of Object.values(gl.layers)) {
          g.deleteBuffer(l.buffer);
          g.deleteVertexArray(l.vao);
        }
        g.deleteProgram(gl.program);
      }
      canvas.remove();
      text?.remove();
      probe.remove();
      gl = null;
      ctx2d = null;
    },
  };
}
