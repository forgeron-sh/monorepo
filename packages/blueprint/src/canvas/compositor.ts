// The one presenter of a Blueprint layer: every scene in view drawn on one screen-space canvas, at
// whole screen pixels and an integer scale (docs/blueprint/engine.md §3, "On @forgeron/canvas").
// WebGL2 when the browser gives a context (each scene's slots go up as an `R8UI` texture, a palette
// uniform colours them, one scissored triangle per scene); the 2D canvas otherwise (the engine
// paints RGBA, an offscreen canvas per scene, `drawImage` without smoothing).

import type { ResolvedPalette } from "../index";

/** What the compositor reads from a scene handle after a frame. */
export interface Picture {
  readonly size: { width: number; height: number };
  readonly slots: Uint8Array;
  readonly rgba: Uint8ClampedArray | null;
}

/** Where a scene's picture goes: its top-left in canvas pixels and its integer scale. */
export interface Placement {
  id: string;
  x: number;
  y: number;
  scale: number;
}

export interface Compositor {
  readonly kind: "webgl2" | "2d";
  /** The engine paints RGBA for this compositor (2D); WebGL2 colours the slots itself. */
  readonly paints: boolean;
  /** The canvas's size in CSS pixels: one canvas pixel per CSS pixel. */
  resize(width: number, height: number): void;
  palette(colors: ResolvedPalette): void;
  /** Takes a scene's last frame (copies it out of the module's memory). */
  upload(id: string, picture: Picture): void;
  drop(id: string): void;
  /** Clears the canvas and draws the placed pictures, in order. */
  draw(placements: readonly Placement[]): void;
  dispose(): void;
}

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp usampler2D;
uniform usampler2D slots;
uniform vec3 palette[8];
uniform ivec2 origin;
uniform int scale;
uniform int height;
out vec4 color;
void main() {
  ivec2 at = ivec2(gl_FragCoord.xy);
  // Canvas row 0 is the top: flip, then find the raster pixel under this screen pixel.
  ivec2 q = ivec2(at.x, height - 1 - at.y) - origin;
  uint s = texelFetch(slots, q / scale, 0).r;
  if (s == 0u || s > 7u) discard;
  color = vec4(palette[s], 1.0);
}`;

/** Slot order of the palette uniform: slot 0 is empty, then `SLOT_NAMES`. */
const SLOTS = ["bg", "ink", "dim", "faint", "accent", "signal", "alert"] as const;

function shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(`blueprint layer: ${gl.getShaderInfoLog(s) ?? "shader"}`);
  return s;
}

function webgl2(canvas: HTMLCanvasElement): Compositor | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false,
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: true,
    });
  } catch {
    gl = null;
  }
  if (!gl || typeof gl.createProgram !== "function") return null;
  const g = gl;
  const program = g.createProgram()!;
  g.attachShader(program, shader(g, g.VERTEX_SHADER, VERTEX));
  g.attachShader(program, shader(g, g.FRAGMENT_SHADER, FRAGMENT));
  g.linkProgram(program);
  if (!g.getProgramParameter(program, g.LINK_STATUS))
    throw new Error(`blueprint layer: ${g.getProgramInfoLog(program) ?? "link"}`);
  g.useProgram(program);
  g.bindVertexArray(g.createVertexArray());
  g.pixelStorei(g.UNPACK_ALIGNMENT, 1);
  g.activeTexture(g.TEXTURE0);
  const at = (name: string) => g.getUniformLocation(program, name);
  g.uniform1i(at("slots"), 0);
  const uPalette = at("palette");
  const uOrigin = at("origin");
  const uScale = at("scale");
  const uHeight = at("height");
  const textures = new Map<string, { texture: WebGLTexture; width: number; height: number }>();
  const colors = new Float32Array(24);
  let width = 0;
  let height = 0;

  return {
    kind: "webgl2",
    paints: false,
    resize(w, h) {
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      g.viewport(0, 0, w, h);
      g.uniform1i(uHeight, h);
    },
    palette(c) {
      SLOTS.forEach((name, i) => {
        const rgb = c[name];
        colors[(i + 1) * 3] = rgb[0] / 255;
        colors[(i + 1) * 3 + 1] = rgb[1] / 255;
        colors[(i + 1) * 3 + 2] = rgb[2] / 255;
      });
      g.uniform3fv(uPalette, colors);
    },
    upload(id, picture) {
      const { width: w, height: h } = picture.size;
      let t = textures.get(id);
      if (!t) {
        const texture = g.createTexture()!;
        g.bindTexture(g.TEXTURE_2D, texture);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
        t = { texture, width: 0, height: 0 };
        textures.set(id, t);
      } else g.bindTexture(g.TEXTURE_2D, t.texture);
      if (t.width !== w || t.height !== h) {
        g.texImage2D(g.TEXTURE_2D, 0, g.R8UI, w, h, 0, g.RED_INTEGER, g.UNSIGNED_BYTE, null);
        t.width = w;
        t.height = h;
      }
      g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, w, h, g.RED_INTEGER, g.UNSIGNED_BYTE, picture.slots);
    },
    drop(id) {
      const t = textures.get(id);
      if (t) g.deleteTexture(t.texture);
      textures.delete(id);
    },
    draw(placements) {
      g.disable(g.SCISSOR_TEST);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      g.enable(g.SCISSOR_TEST);
      for (const p of placements) {
        const t = textures.get(p.id);
        if (!t || t.width === 0) continue;
        const w = t.width * p.scale;
        const h = t.height * p.scale;
        // Only the part on the canvas: the shader never reads outside the texture.
        const x0 = Math.max(0, p.x);
        const y0 = Math.max(0, p.y);
        const x1 = Math.min(width, p.x + w);
        const y1 = Math.min(height, p.y + h);
        if (x1 <= x0 || y1 <= y0) continue;
        g.scissor(x0, height - y1, x1 - x0, y1 - y0);
        g.bindTexture(g.TEXTURE_2D, t.texture);
        g.uniform2i(uOrigin, p.x, p.y);
        g.uniform1i(uScale, p.scale);
        g.drawArrays(g.TRIANGLES, 0, 3);
      }
      g.disable(g.SCISSOR_TEST);
    },
    dispose() {
      for (const t of textures.values()) g.deleteTexture(t.texture);
      textures.clear();
      g.deleteProgram(program);
      g.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

function canvas2d(canvas: HTMLCanvasElement): Compositor {
  const ctx = canvas.getContext("2d");
  const doc = canvas.ownerDocument;
  const pictures = new Map<string, HTMLCanvasElement>();
  return {
    kind: "2d",
    paints: true,
    resize(w, h) {
      canvas.width = w;
      canvas.height = h;
    },
    palette() {},
    upload(id, picture) {
      const rgba = picture.rgba;
      if (!rgba) return;
      const { width: w, height: h } = picture.size;
      let off = pictures.get(id);
      if (!off) {
        off = doc.createElement("canvas");
        pictures.set(id, off);
      }
      if (off.width !== w || off.height !== h) {
        off.width = w;
        off.height = h;
      }
      const octx = off.getContext("2d");
      if (!octx) return;
      const image = octx.createImageData(w, h);
      image.data.set(rgba);
      octx.putImageData(image, 0, 0);
    },
    drop(id) {
      pictures.delete(id);
    },
    draw(placements) {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      for (const p of placements) {
        const off = pictures.get(p.id);
        if (!off || off.width === 0) continue;
        ctx.drawImage(off, p.x, p.y, off.width * p.scale, off.height * p.scale);
      }
    },
    dispose() {
      pictures.clear();
    },
  };
}

/** WebGL2 when asked and available, else the 2D canvas. */
export function createCompositor(
  canvas: HTMLCanvasElement,
  prefer: "webgl2" | "2d" = "webgl2",
): Compositor {
  return (prefer === "webgl2" ? webgl2(canvas) : null) ?? canvas2d(canvas);
}
