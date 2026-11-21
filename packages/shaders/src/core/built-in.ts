import { PRESET_SCHEMA_ID, type Preset, type Step } from "./contract";
import { FIELD_TONES } from "./passes/palette";
import {
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
  hatch: preset("hatch", { type: "constant", value: 0 }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: true, origin: "top", steps: [[0, 1]] },
    {
      type: "hatch",
      tone: 1,
      over: [0],
      period: 4,
      width: 2,
      speed: 6,
      direction: "down",
      x0: 0.08,
      x1: 0.6,
      y0: 0.4,
      y1: 0.6,
    },
    PALETTE,
  ]),
  dissolve: preset("dissolve", { type: "field", mode: "field" }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    { type: "dissolve", tone: 0, over: [], progress: 0.5, cycle: 3, matrix: 8 },
    PALETTE,
  ]),
  ring: preset("ring", { type: "constant", value: 0 }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: true, origin: "top", steps: [[0, 1]] },
    {
      type: "ring",
      cx: 0.5,
      cy: 0.5,
      speed: 0.45,
      width: 2.5,
      start: 0,
      life: 1,
      repeat: 3,
      tones: [2, 1],
      matrix: 8,
    },
    PALETTE,
  ]),
  sparks: preset(
    "sparks",
    { type: "front", shape: "rect", direction: "close", cycle: 4.2, hold: 0.9, ring: 4 },
    [
      { type: "pixelate", size: 4 },
      { type: "sparks", tick: 0.18, fly: 0.003 },
      { type: "ordered", matrix: 4, centered: false, origin: "top", steps: BURN_STEPS },
      {
        type: "palette",
        tones: [
          { var: "--bg", fallback: "#0a0a0a" },
          { var: "--line", fallback: "#2b2b2b" },
          { var: "--ink", fallback: "#ededed" },
          { var: "--accent", fallback: "#ff4f1f" },
          { var: "--danger", fallback: "#ff6b81" },
        ],
        transparent: [],
      },
    ],
  ),
  reveal: preset("reveal", { type: "field", mode: "globe" }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    {
      type: "reveal",
      duration: 1.5,
      hold: 1.5,
      loop: true,
      front: [2, 1],
      band: 0.06,
      dither: 0.12,
      matrix: 8,
    },
    PALETTE,
  ]),
  glow: preset("glow", { type: "field", mode: "ember" }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    { type: "glow", tones: [2], over: [0, 1], tone: 2, radius: 2, strength: 3, matrix: 4 },
    GRID,
    PALETTE,
  ]),
});

const GREYS = [
  { var: "--bg", fallback: "#0d0d0d" },
  { var: "--line", fallback: "#2b2b2b" },
  { var: "--ink-dim", fallback: "#575757" },
  { var: "--ink-muted", fallback: "#8c8c8c" },
  { var: "--ink", fallback: "#dcdcdc" },
] as const;
const EMBER = [
  { var: "--bg", fallback: "#0d0d0d" },
  { var: "--line-strong", fallback: "#3a1708" },
  { var: "--ink-dim", fallback: "#8a3508" },
  { var: "--accent", fallback: "#ff6a13" },
  { var: "--ink", fallback: "#ffd7b0" },
] as const;
const FLAT: Step = { type: "ordered", matrix: 8, centered: true, origin: "top", steps: [[0, 1]] };

/**
 * The roles of the language (docs/shaders/design.md §0): a page or a component asks for a role,
 * not an effect. Each is a preset; the looks below are the defaults a wrapper tunes.
 */
const rolePresets = (): Record<string, Preset> => ({
  "role-background": {
    ...fieldPreset({ mode: "field", accent: false }),
    name: "role-background",
  },
  // The mask of the title comes from the page: a `tone` source (1 inside a letter).
  "role-title": preset("role-title", { type: "tone" }, [
    FLAT,
    {
      type: "reveal",
      duration: 1.5,
      hold: 1.5,
      loop: false,
      front: [3, 2],
      band: 0.06,
      dither: 0.12,
      matrix: 8,
    },
    { type: "palette", tones: GREYS.slice(0, 5), transparent: [0] },
  ]),
  "role-image": { ...ditheredImagePreset(), name: "role-image" },
  "role-transition": preset("role-transition", { type: "field", mode: "field" }, [
    { type: "pixelate", size: 4 },
    { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD_STEPS },
    { type: "dissolve", tone: 0, over: [], progress: 0.5, cycle: 3, matrix: 8 },
    { type: "palette", tones: FIELD_TONES, transparent: [0] },
  ]),
  "role-progress": preset("role-progress", { type: "constant", value: 0 }, [
    { type: "pixelate", size: 4 },
    FLAT,
    {
      type: "hatch",
      tone: 2,
      over: [0],
      period: 5,
      width: 2,
      speed: 8,
      direction: "down",
      x0: 0.08,
      x1: 0.6,
      y0: 0.4,
      y1: 0.6,
    },
    {
      type: "hatch",
      tone: 1,
      over: [0],
      period: 4,
      width: 1,
      speed: 0,
      direction: "down",
      x0: 0.6,
      x1: 0.92,
      y0: 0.4,
      y1: 0.6,
    },
    { type: "palette", tones: EMBER.slice(0, 3), transparent: [0] },
  ]),
  "role-ember": { ...hearthPreset(), name: "role-ember" },
  "role-selection": preset("role-selection", { type: "constant", value: 0 }, [
    { type: "pixelate", size: 4 },
    FLAT,
    {
      type: "hatch",
      tone: 1,
      over: [0],
      period: 6,
      width: 1,
      speed: 4,
      direction: "down",
      x0: 0.2,
      x1: 0.8,
      y0: 0.25,
      y1: 0.75,
    },
    { type: "palette", tones: EMBER.slice(0, 3), transparent: [0] },
  ]),
  "role-feedback": preset("role-feedback", { type: "constant", value: 0 }, [
    { type: "pixelate", size: 4 },
    FLAT,
    {
      type: "ring",
      cx: 0.5,
      cy: 0.5,
      speed: 0.45,
      width: 2.5,
      start: 0,
      life: 1,
      repeat: 3,
      tones: [3, 2, 1],
      matrix: 8,
    },
    { type: "palette", tones: EMBER.slice(0, 4), transparent: [0] },
  ]),
});

/**
 * The burns: a `front` (a rectangle closing onto a band, or a lobed ring from the centre), the
 * `sparks` along its edge, the 4×4 ordered dither (the fringe), a palette whose tone 1 is
 * transparent (the picture under the canvas shows through) and tone 0 the page's background. Both
 * directions of both shapes. `driven` presets read the progress a page sets (`mountPreset`'s
 * `set`), the others loop.
 */
const BURN_STEPS: [number, number][] = [
  [0, 1],
  [1.5, 0],
  [2.5, 0],
  [3.5, 0],
];
const burn = (
  name: string,
  shape: "rect" | "lobed",
  direction: "close" | "open",
  embers: readonly string[],
  sparks: Record<string, number>,
  front: Record<string, unknown> = {},
): Preset =>
  preset(
    name,
    {
      type: "front",
      shape,
      direction,
      cycle: shape === "rect" ? 4.2 : 1.9,
      hold: 0.9,
      ring: 4,
      ...front,
    },
    [
      { type: "pixelate", size: 4 },
      { type: "sparks", ...sparks },
      { type: "ordered", matrix: 4, centered: false, origin: "top", steps: BURN_STEPS },
      {
        type: "palette",
        tones: [
          { var: "--bg", fallback: "#0a0a0a" },
          { var: "--bg", fallback: "#0a0a0a" },
          ...embers.map((v, i) => ({
            var: v,
            fallback: ["#ededed", "#ff4f1f", "#ff6b81"][i] ?? "#fff",
          })),
        ],
        transparent: [1],
      },
    ],
  );
const FIRE = ["--ink", "--accent", "--danger"];
const ASH = ["--ink", "--ink-muted", "--ink-dim"];

const burnPresets = (): Record<string, Preset> => ({
  "burn-frame-close": burn("burn-frame-close", "rect", "close", FIRE, { tick: 0.18, fly: 0.003 }),
  "burn-frame-open": burn("burn-frame-open", "rect", "open", FIRE, { tick: 0.18, fly: 0.003 }),
  "burn-lobed-open": burn("burn-lobed-open", "lobed", "open", ASH, { tick: 0.12, fly: 0.004 }),
  "burn-lobed-close": burn("burn-lobed-close", "lobed", "close", ASH, { tick: 0.12, fly: 0.004 }),
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
    ...rolePresets(),
    ...burnPresets(),
  };
  for (const [name, p] of Object.entries(all)) all[name] = { $schema: PRESET_SCHEMA_ID, ...p };
  return all;
}
