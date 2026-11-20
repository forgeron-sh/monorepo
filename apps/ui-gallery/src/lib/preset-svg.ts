// A preset of @forgeron/shaders as a static SVG at build time (the cards of the Shaders section):
// the chain up to its palette runs on the CPU, one path per tone filled with the tone's token, so
// a card ships no JavaScript. Passes after the palette (a `present` pass) work on colours and are
// left to the live page.
import { chainOf, cssColor, type Preset, runCpu, toSvgPath } from "@forgeron/shaders";

export interface PresetSvg {
  width: number;
  height: number;
  paths: { fill: string; d: string }[];
}

/** The moment a card freezes: a ring is only alive in its first second. */
const CARD_TIME: Record<string, number> = {
  ring: 0.45,
  "role-feedback": 0.45,
  // The lobed front has opened out by 1.2 s.
  "burn-lobed-open": 0.7,
};

/**
 * The tones of `preset` as paths. Tone 0 is left to the card's background, unless `base` (a
 * preset drawn over another: its tone 0 covers what is under it). Transparent tones are left out.
 */
export function presetSvg(
  preset: Preset,
  {
    width = 96,
    height = 60,
    time,
    base = false,
  }: Partial<{ width: number; height: number; time: number; base: boolean }> = {},
): PresetSvg {
  const at = preset.passes.findIndex((s) => s.type === "palette");
  const palette = preset.passes[at];
  const tones = (palette?.tones ?? []) as Parameters<typeof cssColor>[0][];
  const transparent = new Set((palette?.transparent ?? []) as number[]);
  // Cell by cell: no pixelate (one cell per unit), no present pass (no gap at one unit).
  const cut: Preset = {
    ...preset,
    passes: preset.passes.slice(0, at).filter((s) => s.type !== "pixelate" && s.type !== "grid"),
  };
  const t = time ?? CARD_TIME[preset.name ?? ""] ?? 1.2;
  const frame = runCpu(chainOf(cut), width, height, { px: 1, time: t });
  return {
    width,
    height,
    paths: tones
      .map((tone, i) => ({ i, fill: cssColor(tone), d: toSvgPath(frame, i, { max: i }) }))
      .filter((p) => (p.i > 0 || base) && !transparent.has(p.i) && p.d)
      .map(({ fill, d }) => ({ fill, d })),
  };
}
