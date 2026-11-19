import type { ColorRef } from "../core/color";
import { bindChain } from "../core/contract";
import { gridGlsl } from "../core/passes/grid.glsl";
import { orderedGlsl } from "../core/passes/ordered.glsl";
import { paletteGlsl } from "../core/passes/palette.glsl";
import { pixelateStep } from "../core/passes/pixelate";
import { fieldPreset } from "../core/presets";
import { FIELD_MODES, type FieldMode } from "../core/sources/field";
import { fieldGlsl } from "../core/sources/field.glsl";
import { PIXEL_CONTEXT } from "./gl";
import { glPipeline } from "./pipeline-gl";
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
 * Draws a generator field (`fieldPreset`, its GLSL side) on `canvas` with WebGL2 and keeps it drawn: resizes
 * with the canvas, follows the pointer over its parent, animates only while on screen, one frame
 * at `t = 0` when still. Null, leaving the canvas blank, where WebGL2 is unavailable or the
 * program does not compile.
 */
export function mountField(canvas: HTMLCanvasElement, options: FieldOptions): ShaderHandle | null {
  const gl = canvas.getContext("webgl2", PIXEL_CONTEXT);
  if (!gl) return null;
  const colors = options.colors ?? {};
  const chain = bindChain(
    fieldPreset({
      mode: options.mode in FIELD_MODES ? options.mode : "ember",
      accent: options.accent,
      tones: [
        colors.bg ?? { var: "--bg", fallback: "#0a0a0a" },
        colors.ink ?? { var: "--ink", fallback: "#ededed" },
        colors.accent ?? { var: "--accent", fallback: "#ff4f1f" },
      ],
    }),
    { field: fieldGlsl },
    { pixelate: pixelateStep, ordered: orderedGlsl, grid: gridGlsl, palette: paletteGlsl },
  );
  const colorsOf = colorCache(canvas);
  let pipeline;
  try {
    pipeline = glPipeline(gl, chain, { resolve: colorsOf.resolve });
  } catch {
    return null;
  }
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
      pipeline.render({ width: canvas.width, height: canvas.height, px, time: t, mouse });
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
