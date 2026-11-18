/**
 * The WebGL2 presenter (docs/blueprint/engine.md §3, "Presenters"), opt-in for full-screen
 * scenes, the editor and scenes with post passes: the slot buffer goes up as an `R8UI` texture
 * straight from the module's memory, a palette uniform colours it and a full-screen triangle
 * upscales it by an integer and draws the grid gap. Browsers cap live contexts per page, so at
 * most four presenters live at once: `presentWebGL2` returns `null` beyond (the player then
 * falls back to the 2D presenter).
 */
import type { ResolvedPalette } from "../core/palette";
import { SLOT_NAMES } from "../core/frame";
import { gridCell } from "../core/svg";
import type { Presentable, Presenter } from "./present-2d";

/** Live WebGL2 presenters a page may hold. */
export const MAX_WEBGL2 = 4;
let live = 0;

/** How many WebGL2 presenters are live (tests). */
export const liveWebGL2 = (): number => live;

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
uniform int pixel;
uniform int cell;
uniform int rows;
out vec4 color;
void main() {
  ivec2 at = ivec2(gl_FragCoord.xy);
  // Canvas row 0 is the top: flip, then find the raster pixel and the place inside its cell.
  int y = rows * pixel - 1 - at.y;
  ivec2 p = ivec2(at.x / pixel, y / pixel);
  ivec2 inner = ivec2(at.x - p.x * pixel, y - p.y * pixel);
  uint s = texelFetch(slots, p, 0).r;
  if (s == 0u || s > 7u || inner.x >= cell || inner.y >= cell) {
    color = vec4(0.0);
    return;
  }
  color = vec4(palette[s], 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(`blueprint presenter: ${gl.getShaderInfoLog(shader) ?? "shader"}`);
  return shader;
}

export interface WebGL2Presenter extends Presenter {
  /** The palette, from CSS tokens on the canvas (as the 2D presenter's). */
  palette(colors: ResolvedPalette): void;
  readonly gl: WebGL2RenderingContext;
}

export function presentWebGL2(canvas: HTMLCanvasElement): WebGL2Presenter | null {
  if (live >= MAX_WEBGL2) return null;
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    antialias: false,
    alpha: true,
  });
  if (!gl) return null;
  live++;
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`blueprint presenter: ${gl.getProgramInfoLog(program) ?? "link"}`);
  gl.useProgram(program);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const at = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform1i(at("slots"), 0);
  const uPalette = at("palette");
  const uPixel = at("pixel");
  const uCell = at("cell");
  const uRows = at("rows");
  const colors = new Float32Array(24);
  let width = 0;
  let height = 0;
  let disposed = false;

  return {
    kind: "webgl2",
    gl,
    palette(c) {
      SLOT_NAMES.forEach((name, i) => {
        const rgb = c[name];
        colors[(i + 1) * 3] = rgb[0] / 255;
        colors[(i + 1) * 3 + 1] = rgb[1] / 255;
        colors[(i + 1) * 3 + 2] = rgb[2] / 255;
      });
      gl.uniform3fv(uPalette, colors);
    },
    resize(w, h, px, gap) {
      width = w;
      height = h;
      const scale = gap > 0 ? px : 1;
      canvas.width = w * scale;
      canvas.height = h * scale;
      canvas.style.imageRendering = "pixelated";
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1i(uPixel, scale);
      gl.uniform1i(uCell, gap > 0 ? gridCell(px, gap) : 1);
      gl.uniform1i(uRows, h);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, w, h, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, null);
    },
    present(scene: Presentable) {
      if (disposed || width === 0 || height === 0) return;
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        width,
        height,
        gl.RED_INTEGER,
        gl.UNSIGNED_BYTE,
        scene.slots,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      live--;
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
