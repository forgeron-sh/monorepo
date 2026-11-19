import { mountField as mountFieldShader } from "@forgeron/shaders/dom";
import type { FieldMode } from "../core/field";
import type { ColorRef } from "../core/filters";

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

/**
 * Draws a generator field on a canvas and keeps it drawn: `mountField` of
 * `@forgeron/shaders/dom` (WebGL2, the `fieldPreset`), with Blueprint's option names. Returns
 * null, leaving the canvas blank, where WebGL2 is unavailable.
 */
export function mountField(canvas: HTMLCanvasElement, options: FieldOptions): MountedField | null {
  return mountFieldShader(canvas, {
    mode: options.mode,
    ...(options.pixel !== undefined ? { pixel: options.pixel } : {}),
    ...(options.accent !== undefined ? { accent: options.accent } : {}),
    ...(options.colors ? { colors: options.colors } : {}),
    ...(options.reducedMotion !== undefined ? { still: options.reducedMotion } : {}),
  });
}
