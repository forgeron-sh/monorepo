import type { ColorRef } from "./color";

// The dither field's settings, apart from presets.ts so that its live mount (`mountDitherField`,
// `ditherFieldPixels`) bundles them without the preset builders.

/** The dither field's tones by default: background, a strong line, the ember. */
export const DITHER_FIELD_TONES = ["--bg", "--line-strong", "--accent"] as const;
export const DITHER_FIELD_FALLBACKS = ["#0a0a0a", "#2e2e2e", "#ff4f1f"] as const;

/** The dither field's thresholds: `[offset, scale]` of each tone above the background. */
export const DITHER_FIELD_STEPS: readonly (readonly [number, number])[] = [
  [0, 0.9],
  [0.45, 1],
];

/** The dither field's tones as colour references: a token takes the dark theme's fallback. */
export const ditherFieldTones = (tones: readonly string[] = DITHER_FIELD_TONES): ColorRef[] =>
  tones.map((t, i) =>
    t.startsWith("--") ? { var: t, fallback: DITHER_FIELD_FALLBACKS[i] ?? "#000" } : t,
  );
