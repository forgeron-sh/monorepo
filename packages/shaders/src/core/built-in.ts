import { PRESET_SCHEMA_ID, type Preset, type Step } from "./contract";
import { FIELD_TONES } from "./passes/palette";
import {
  DITHER_FIELD_FALLBACKS,
  ditherFieldPreset,
  ditheredImagePreset,
  fieldPreset,
  hearthPreset,
  preset,
} from "./presets";

/** The new passes of S2, each on a live source: the gallery's pages and the editor's starts. */
const FIELD_STEPS: [number, number][] = [
  [0, 1],
  [0.86, 0.12],
];
const GRID: Step = { type: "grid", gap: 0.16, min: 4, tone: 0 };
const PALETTE: Step = { type: "palette", tones: FIELD_TONES, transparent: [] };

export const passPresets = (): Record<string, Preset> => ({
  "blue-noise": preset("blue-noise", { type: "field", mode: "ember" }, [
    { type: "pixelate", size: 4 },
    { type: "blue-noise", origin: "bottom", steps: FIELD_STEPS },
    GRID,
    PALETTE,
  ]),
  "floyd-steinberg": preset("floyd-steinberg", { type: "heat" }, [
    { type: "pixelate", size: 4 },
    { type: "floyd-steinberg", levels: 3, serpentine: true },
    {
      type: "palette",
      tones: ["--bg", "--line-strong", "--accent"].map((v, i) => ({
        var: v,
        fallback: DITHER_FIELD_FALLBACKS[i] ?? "#000",
      })),
      transparent: [],
    },
  ]),
  halftone: preset("halftone", { type: "field", mode: "globe" }, [
    { type: "pixelate", size: 2 },
    { type: "halftone", size: 6, angle: 45, tone: 1 },
    PALETTE,
  ]),
  scanlines: preset("scanlines", { type: "field", mode: "field" }, [
    { type: "pixelate", size: 3 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    PALETTE,
    { type: "scanlines", period: 3, width: 1, strength: 0.55, origin: "top" },
  ]),
  edges: preset("edges", { type: "field", mode: "dissolve" }, [
    { type: "pixelate", size: 4 },
    { type: "edges", scale: 2.5 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    GRID,
    PALETTE,
  ]),
  glow: preset("glow", { type: "field", mode: "ember" }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    { type: "glow", tones: [2], over: [0, 1], tone: 2, radius: 2, strength: 3, matrix: 4 },
    GRID,
    PALETTE,
  ]),
  crt: preset("crt", { type: "field", mode: "globe" }, [
    { type: "pixelate", size: 3 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    PALETTE,
    { type: "crt", curvature: 0.12, mask: 0.3, bloom: 0.35, vignette: 0.35 },
  ]),
});

/**
 * The built-in presets, by name (the gallery and, later, the editor list them). A function, so
 * a page that mounts one effect does not bundle the others.
 */
export function builtInPresets(): Record<string, Preset> {
  const all: Record<string, Preset> = {
    "field-ember": fieldPreset({ mode: "ember" }),
    "field-globe": fieldPreset({ mode: "globe" }),
    "field-dissolve": fieldPreset({ mode: "dissolve" }),
    "field-field": fieldPreset({ mode: "field", accent: false }),
    "dither-field": ditherFieldPreset(),
    "dithered-image": ditheredImagePreset(),
    hearth: hearthPreset(),
    ...passPresets(),
  };
  for (const [name, p] of Object.entries(all)) all[name] = { $schema: PRESET_SCHEMA_ID, ...p };
  return all;
}
