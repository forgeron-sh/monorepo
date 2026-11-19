import { glyph, glyphWidth, textWidth } from "@forgeron/blueprint";
import {
  type CellRect,
  type ColorRef,
  type FieldMode,
  hearthGrid as gridOf,
  type HearthGrid,
  type PixelFace,
} from "@forgeron/shaders";
import {
  type HearthOptions as BaseHearthOptions,
  mountField,
  mountHearth as mountHearthOn,
  type ShaderHandle,
} from "@forgeron/shaders/dom";

// ui's names over @forgeron/shaders: the pixel face of the hearth is Blueprint's, the field's
// colours are tokens or literal colours with the site's dark theme as fallbacks.

/** Blueprint's pixel face, for the hearth's wordmark. */
const PIXEL_FACE: PixelFace = { glyph, glyphWidth, textWidth };

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

const tone = (value: string | undefined, name: string, fallback: string): ColorRef =>
  value === undefined || value.startsWith("--") ? { var: value ?? name, fallback } : value;

/**
 * A generator field of forgeron.sh (ember, globe, dissolve, field) on `canvas`, in WebGL2
 * (`mountField` of `@forgeron/shaders/dom`). Null, leaving the canvas blank, without WebGL2.
 */
export function mountFieldShader(
  canvas: HTMLCanvasElement,
  options: FieldShaderOptions,
): ShaderHandle | null {
  const c = options.colors ?? {};
  return mountField(canvas, {
    ...options,
    colors: {
      bg: tone(c.bg, "--bg", "#0a0a0a"),
      ink: tone(c.ink, "--ink", "#ededed"),
      accent: tone(c.accent, "--accent", "#ff4f1f"),
    },
  });
}

/** The hearth's grid, the wordmark in Blueprint's pixel face. */
export function hearthGrid(cols: number, rows: number, slot: CellRect, text?: string): HearthGrid {
  return gridOf(PIXEL_FACE, cols, rows, slot, text);
}

export type HearthOptions = Omit<BaseHearthOptions, "face">;

/**
 * Draws the hearth on `root`'s canvas, the wordmark inside `root`'s `[data-hearth-word]` slot
 * (`mountHearth` of `@forgeron/shaders/dom` in Blueprint's pixel face).
 */
export function mountHearth(root: HTMLElement, options: HearthOptions = {}): ShaderHandle | null {
  return mountHearthOn(root, { ...options, face: PIXEL_FACE });
}
