import { FIELD_FRAGMENT, FIELD_MODES, FIELD_VERTEX, type FieldMode } from "@forgeron/blueprint";
import { animateCanvas, prefersStill, readTone, type ShaderHandle } from "./surface";

/**
 * The generator fields of forgeron.sh (`canvas[data-shader]`): ember, globe, dissolve and field,
 * one WebGL fragment shader quantised by the 8×8 Bayer matrix to the background, the ink and the
 * ember. The shader source is `FIELD_FRAGMENT` of `@forgeron/blueprint`, the one the site runs;
 * this is its canvas glue for apps, which take Blueprint's core only.
 */

export type { FieldMode };

/** The four modes, in the order of the shader. */
export const FIELD_SHADERS = Object.keys(FIELD_MODES) as FieldMode[];

export interface FieldShaderOptions {
  mode: FieldMode;
  /** Side of one cell in CSS pixels (4 by default), times the device pixel ratio capped at 2. */
  pixel?: number;
  /** `false` draws the brightest cells in ink instead of the ember. */
  accent?: boolean;
  /** Tokens or colours of the three tones; `--bg`, `--ink` and `--accent` by default. */
  colors?: { bg?: string; ink?: string; accent?: string };
  /** `ember` bends towards the pointer over the canvas's parent (on by default). */
  pointer?: boolean;
  /** Forces a still frame (`true`) or motion (`false`); the reader's preference otherwise. */
  still?: boolean;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/**
 * Draws a generator field on `canvas` with WebGL and keeps it drawn. Null, leaving the canvas
 * blank, where WebGL is unavailable.
 */
export function mountFieldShader(
  canvas: HTMLCanvasElement,
  options: FieldShaderOptions,
): ShaderHandle | null {
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, FIELD_VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FIELD_FRAGMENT);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const set3 = (n: string, value: string, fallback: string) => {
    const c = readTone(canvas, value, fallback);
    gl.uniform3f(u(n), c[0] / 255, c[1] / 255, c[2] / 255);
  };
  const colors = options.colors ?? {};
  set3("uBg", colors.bg ?? "--bg", "#0a0a0a");
  set3("uInk", colors.ink ?? "--ink", "#ededed");
  set3("uAccent", colors.accent ?? "--accent", "#ff4f1f");
  gl.uniform1f(u("uMode"), FIELD_MODES[options.mode] ?? 0);
  gl.uniform1f(u("uAccentOn"), options.accent === false ? 0 : 1);

  const win = canvas.ownerDocument.defaultView;
  const dpr = Math.min(win?.devicePixelRatio || 1, 2);
  gl.uniform1f(u("uPx"), (options.pixel ?? 4) * dpr);
  const mouse = { x: 0.5, y: 0.2 };
  const still = prefersStill(canvas, options.still);

  const handle = animateCanvas(canvas, {
    still,
    resize() {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u("uRes"), canvas.width, canvas.height);
    },
    draw(t) {
      gl.uniform1f(u("uTime"), t);
      gl.uniform2f(u("uMouse"), mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  });
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = 1 - (e.clientY - r.top) / r.height;
  };
  const parent = options.pointer === false || still ? null : canvas.parentElement;
  parent?.addEventListener("pointermove", onPointer);

  return {
    destroy() {
      handle.destroy();
      parent?.removeEventListener("pointermove", onPointer);
    },
  };
}
