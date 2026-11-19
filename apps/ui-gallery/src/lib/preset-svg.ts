// A built-in preset of @forgeron/shaders as a static SVG at build time (the cards of the Shaders
// section): the chain up to its palette runs on the CPU, one path per tone filled with the tone's
// token, so a card ships no JavaScript. Passes after the palette (scanlines, CRT) work on colours
// and are left to the live page.
import {
  builtInPresets,
  chainOf,
  cssColor,
  type Preset,
  runCpu,
  toSvgPath,
} from "@forgeron/shaders";

export interface PresetSvg {
  width: number;
  height: number;
  paths: { fill: string; d: string }[];
}

export function presetSvg(name: string, width = 96, height = 60, time = 1.2): PresetSvg {
  const preset = builtInPresets()[name];
  if (!preset) throw new Error(`no built-in preset "${name}"`);
  const at = preset.passes.findIndex((s) => s.type === "palette");
  const palette = preset.passes[at];
  const tones = (palette?.tones ?? []) as Parameters<typeof cssColor>[0][];
  // Cell by cell: no pixelate (one cell per unit), no present pass (no gap at one unit).
  const cut: Preset = {
    ...preset,
    passes: preset.passes.slice(0, at).filter((s) => s.type !== "pixelate" && s.type !== "grid"),
  };
  const frame = runCpu(chainOf(cut), width, height, { px: 1, time });
  return {
    width,
    height,
    paths: tones
      .map((tone, i) => ({ fill: cssColor(tone), d: toSvgPath(frame, i, { max: i }) }))
      .filter((p, i) => i > 0 && p.d),
  };
}
