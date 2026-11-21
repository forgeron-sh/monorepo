import type { ColorRef } from "../core/color";
import {
  FIELD_FRAGMENT,
  FIELD_FRAGMENT_INK,
  FIELD_MODE_UNIFORM,
  FIELD_TONES_UNIFORM,
} from "../core/field.baked";
import { GL_VERTEX } from "../core/vertex";
import { FIELD_MODES, type FieldMode } from "../core/sources/field";
import { linkProgram, PIXEL_CONTEXT } from "./gl";
import { animateCanvas, colorCache, prefersStill, type ShaderHandle } from "./surface";

/** The four modes, in the order of the shader. */
export const FIELD_SHADERS = /* @__PURE__ */ Object.keys(FIELD_MODES) as FieldMode[];

export interface FieldOptions {
  mode: FieldMode;
  /** Side of one cell in CSS pixels (4 by default), times the device pixel ratio capped at 2. */
  pixel?: number;
  /** `false` draws the brightest cells in ink instead of the ember. */
  accent?: boolean;
  /** The three tones; `--bg`, `--ink` and `--accent` (dark theme fallbacks) by default. */
  colors?: { bg?: ColorRef; ink?: ColorRef; accent?: ColorRef };
  /** `ember` bends towards the pointer over the canvas's parent (on by default). */
  pointer?: boolean;
  /** Forces a still frame (`true`) or motion (`false`); the reader's preference otherwise. */
  still?: boolean;
}

/**
 * Draws a generator field (`fieldPreset`, its GLSL compiled at build time) on `canvas` with WebGL2
 * and keeps it drawn: resizes with the canvas, follows the pointer over its parent, animates only
 * while on screen, one frame at `t = 0` when still. Null, leaving the canvas blank, where WebGL2
 * is unavailable or the program does not compile.
 */
export function mountField(canvas: HTMLCanvasElement, options: FieldOptions): ShaderHandle | null {
  const gl = canvas.getContext("webgl2", PIXEL_CONTEXT);
  if (!gl) return null;
  const colors = options.colors ?? {};
  const mode = options.mode in FIELD_MODES ? options.mode : "ember";
  const tones: readonly ColorRef[] = [
    colors.bg ?? { var: "--bg", fallback: "#0a0a0a" },
    colors.ink ?? { var: "--ink", fallback: "#ededed" },
    colors.accent ?? { var: "--accent", fallback: "#ff4f1f" },
  ];
  const colorsOf = colorCache(canvas);
  let program: WebGLProgram;
  try {
    // `fieldPreset`'s one stage, compiled at build time (`field.baked.ts`): the same text as
    // `glPipeline` would compile from the chain, without bundling the generators.
    program = linkProgram(
      gl,
      GL_VERTEX,
      options.accent === false ? FIELD_FRAGMENT_INK : FIELD_FRAGMENT,
      `shaders (field-${mode})`,
    );
  } catch {
    return null;
  }
  const at = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    res: at("uRes"),
    px: at("uPx"),
    cells: at("uCells"),
    time: at("uTime"),
    mouse: at("uMouse"),
    mode: at(FIELD_MODE_UNIFORM),
    tones: at(FIELD_TONES_UNIFORM),
  };
  const vao = gl.createVertexArray();
  const toneValues = new Float32Array(tones.length * 4);
  const win = canvas.ownerDocument.defaultView;
  const dpr = Math.min(win?.devicePixelRatio || 1, 2);
  const px = (options.pixel ?? 4) * dpr;
  const mouse: [number, number] = [0.5, 0.2];
  const still = prefersStill(canvas, options.still);

  const handle = animateCanvas(canvas, {
    still,
    resize() {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      colorsOf.reset();
    },
    draw(t) {
      // As `glPipeline` draws a chain of one stage: the inputs, the mode, the tones, one triangle.
      const { width, height } = canvas;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.uniform2f(u.res, width, height);
      gl.uniform1f(u.px, px);
      gl.uniform2f(
        u.cells,
        Math.max(1, Math.ceil(width / px)),
        Math.max(1, Math.ceil(height / px)),
      );
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.mouse, mouse[0], mouse[1]);
      gl.uniform1f(u.mode, FIELD_MODES[mode]);
      tones.forEach((ref, i) => {
        const c = colorsOf.resolve(ref);
        toneValues[i * 4] = c[0] / 255;
        toneValues[i * 4 + 1] = c[1] / 255;
        toneValues[i * 4 + 2] = c[2] / 255;
        toneValues[i * 4 + 3] = 1;
      });
      gl.uniform4fv(u.tones, toneValues);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  });
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse[0] = (e.clientX - r.left) / r.width;
    mouse[1] = 1 - (e.clientY - r.top) / r.height;
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
