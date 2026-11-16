import { FIELD_FRAGMENT, FIELD_MODES, FIELD_VERTEX, type FieldMode } from "../core/field";
import type { ColorRef } from "../core/filters";
import { resolveColor } from "./colors";

export interface FieldOptions {
  mode: FieldMode;
  /** Side of one cell in CSS pixels (4 by default); multiplied by the device pixel ratio, capped at 2. */
  pixel?: number;
  /** `false` draws the brightest cells in ink instead of the accent. */
  accent?: boolean;
  /** Overrides of the three colours; the site's `--bg`, `--ink` and `--accent` by default. */
  colors?: { bg?: ColorRef; ink?: ColorRef; accent?: ColorRef };
  /** Overrides `prefers-reduced-motion` (tests, a pause button). */
  reducedMotion?: boolean;
}

export interface MountedField {
  destroy(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/**
 * Draws a generator field on a canvas with WebGL and keeps it drawn: resizes with the canvas,
 * follows the pointer over the canvas's parent (ember bends towards it), animates only while on
 * screen, and draws one frame at `t = 0` under `prefers-reduced-motion`. Returns null, leaving the
 * canvas blank, where WebGL is unavailable.
 */
export function mountField(canvas: HTMLCanvasElement, options: FieldOptions): MountedField | null {
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
  const set3 = (n: string, ref: ColorRef) => {
    const c = resolveColor(canvas, ref);
    gl.uniform3f(u(n), c[0] / 255, c[1] / 255, c[2] / 255);
  };
  const colors = options.colors ?? {};
  set3("uBg", colors.bg ?? { var: "--bg", fallback: "#0a0a0a" });
  set3("uInk", colors.ink ?? { var: "--ink", fallback: "#ededed" });
  set3("uAccent", colors.accent ?? { var: "--accent", fallback: "#ff4f1f" });
  gl.uniform1f(u("uMode"), FIELD_MODES[options.mode] ?? 0);
  gl.uniform1f(u("uAccentOn"), options.accent === false ? 0 : 1);

  const win = canvas.ownerDocument.defaultView;
  const reduced =
    options.reducedMotion ?? win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const dpr = Math.min(win?.devicePixelRatio || 1, 2);
  gl.uniform1f(u("uPx"), (options.pixel ?? 4) * dpr);
  const mouse = { x: 0.5, y: 0.2 };
  const start = performance.now();
  const now = () => (reduced ? 0 : (performance.now() - start) / 1000);
  let raf = 0;
  let visible = false;

  const draw = (t: number) => {
    gl.uniform1f(u("uTime"), t);
    gl.uniform2f(u("uMouse"), mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = () => {
    draw(now());
    if (visible && !reduced) raf = requestAnimationFrame(loop);
  };
  const resize = () => {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u("uRes"), canvas.width, canvas.height);
  };
  // A resize clears the canvas: redraw at once, on screen or not, so it is never left blank.
  const sized = new ResizeObserver(() => {
    resize();
    draw(now());
  });
  sized.observe(canvas);
  resize();
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = 1 - (e.clientY - r.top) / r.height;
  };
  const parent = canvas.parentElement;
  parent?.addEventListener("pointermove", onPointer);
  const seen = new IntersectionObserver(([entry]) => {
    const on = entry?.isIntersecting ?? false;
    if (on && !visible) {
      visible = true;
      loop();
    } else if (!on) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  });
  seen.observe(canvas);

  return {
    destroy() {
      visible = false;
      cancelAnimationFrame(raf);
      sized.disconnect();
      seen.disconnect();
      parent?.removeEventListener("pointermove", onPointer);
    },
  };
}
