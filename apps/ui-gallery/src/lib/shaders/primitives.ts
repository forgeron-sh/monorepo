// The primitives: one page per source and pass of the registry (`SOURCES`, `PASSES`). The list,
// the descriptions, the options and the live controls come from the package; `NOTES` only adds
// prose, extra versions, and which built-in preset to show a step on when the default does not fit.

import * as shaders from "@forgeron/shaders";
import { builtInPresets, PASSES, type Preset, SOURCES } from "@forgeron/shaders";
import {
  builtIn,
  chainText,
  defaultStep,
  hasStep,
  optionsOf,
  presetCode,
  withStep,
} from "./snippets";
import type { Shader, Snippet, StepRef, Version } from "./types";

interface Note {
  name?: string;
  /** One line; the registry's description otherwise. */
  summary?: string;
  what?: string[];
  /** CPU against GLSL (`bun scripts/shaders/check-agreement.ts`). */
  agreement?: string;
  /** The built-in preset it is shown on: by default the one named after it, else the first with it. */
  preset?: string;
  /** Settings of the step beside the live one: title, note, params. */
  versions?: [string, string, Record<string, unknown>][];
  /** Demos that are not this step's settings: static SVG, a mount. */
  extra?: Version[];
  /** Its source needs data from the page (a picture, a word, a tone function): `extra` only. */
  mount?: boolean;
  code?: Snippet[];
}

const RAMPS: Version[] = ([2, 4, 8] as const).map((n) => ({
  title: `${n}×${n}`,
  note: `ditherPath(64, 16, (x) => x / 63, ${n})`,
  demo: { kind: "ramp", n },
}));

const IMAGES: Version[] = [
  { title: "Source", note: "the picture, before", demo: { kind: "image", raw: true } },
  { title: "Hero", note: "pixel 3 · gain 1.1", demo: { kind: "image", pixel: 3, gain: 1.1 } },
  { title: "Brighter", note: "pixel 3 · gain 1.5", demo: { kind: "image", pixel: 3, gain: 1.5 } },
];

const SOURCE_NOTES: Record<string, Note> = {
  field: {
    summary: "The four generator fields of forgeron.sh: ember, globe, dissolve, field.",
    what: [
      "A value per cell from fractal noise: heat from the bottom edge (ember), a lit sphere turning (globe), bands eaten from the left (dissolve), a quiet drift (field).",
      "Then `ordered` thresholds it with the 8×8 Bayer matrix: whole pixels, never a blur.",
      "The site mounts the same chain compiled at build time (`field.baked.ts`).",
    ],
    agreement: "within a stated share: the noise is float",
    preset: "field-globe",
    versions: [
      ["Ember", 'mode "ember"', { mode: "ember" }],
      ["Dissolve", 'mode "dissolve"', { mode: "dissolve" }],
      ["Field", 'mode "field"', { mode: "field" }],
    ],
  },
  heat: {
    summary: "The dither field's slow heat, rising from the bottom right.",
    what: [
      "Two slow waves stir a heat that rises from the bottom right corner.",
      "CPU only, about 12 frames a second: the field steps, it does not glide.",
    ],
  },
  image: {
    summary: "A picture, one pixel per cell.",
    what: [
      "Reads the picture's pixels from the page (`data.image`), already sized to the frame; on the GPU, a texture of the same pixels.",
      "A preset alone cannot carry the picture: the demos go through `mountDitheredImage`.",
    ],
    mount: true,
    extra: IMAGES,
  },
  tone: {
    summary: "A tone function of the cell, given by the page.",
    what: [
      "`data.tone(x, y)` per cell, row 0 at the top: the mask of a title, a gradient, a shape.",
      "What `ditherPath` runs at build time: a tone function through the ordered dither to an SVG path.",
    ],
    mount: true,
    extra: RAMPS,
  },
  hearth: {
    summary: "The wordmark as hot iron on a bed of embers.",
    what: [
      "Writes tone indices: iron letters, white hot then ember at their foot, a dim bed of embers and a few rising sparks; the pointer is the bellows.",
      "Needs the word set in the pixel face: the demos go through `mountHearth`.",
    ],
    mount: true,
    extra: [
      {
        title: "Footer",
        note: "cell 4",
        demo: { kind: "hearth", text: "Forgeron", cell: 4 },
      },
      { title: "Narrow", note: "cell 2", demo: { kind: "hearth", text: "Forgeron", cell: 2 } },
    ],
  },
  constant: {
    summary: "One value in every cell: the ground a pass draws on.",
    what: [
      "A flat level; the passes after it (hatch, ring) draw the shapes.",
      "The source of the roles that are drawings rather than textures: progress, selection, feedback.",
    ],
    preset: "ring",
  },
  front: {
    summary: "A moving edge, a rectangle or a lobed ring, as the level the dither reads.",
    what: [
      "Writes a distance to the edge and a life; `sparks` reads them for the embers.",
      "A rectangle closing onto a band, or a lobed ring from the centre, in both directions; looping, or driven by the page (`driven`, then `set({ progress })`).",
    ],
    agreement: "tolerance 3 % of pixels (measured 0 to 0.014 %): the distance is float",
    versions: [
      ["Lobed", 'shape "lobed"', { shape: "lobed" }],
      ["Opening", 'direction "open"', { direction: "open" }],
    ],
  },
};

const PASS_NOTES: Record<string, Note> = {
  pixelate: {
    summary: "The cell size: the source is computed once per cell.",
    what: [
      "A layout pass: it comes first, and every pass after it works on cells of `size` CSS pixels.",
      "No GLSL or CPU of its own: the pipeline reads it (`pixelateStep` is both sides).",
    ],
    preset: "field-ember",
    versions: [
      ["Coarse", "size 8", { size: 8 }],
      ["Fine", "size 2", { size: 2 }],
    ],
  },
  ordered: {
    summary: "The Bayer threshold every other shader dithers with.",
    what: [
      "A value becomes a tone index: on when it beats the matrix at that cell.",
      "2×2, 4×4 and 8×8, built by one recurrence (`bayer`, `matrix`). `ditherPath` draws it as a static SVG path at build time; `anvilPath` the logo.",
      "No blur, no alpha: a gradient is a density of whole pixels.",
    ],
    agreement: "exact: 0 pixels differ",
    preset: "field-ember",
    versions: [["4×4", "matrix 4", { matrix: 4 }]],
    extra: [
      ...RAMPS,
      {
        title: "Anvil, dither",
        note: 'anvilPath(24, "dither")',
        demo: { kind: "anvil", mode: "dither" },
      },
      {
        title: "Anvil, fade",
        note: 'anvilPath(24, "fade")',
        demo: { kind: "anvil", mode: "fade" },
      },
    ],
    code: [
      {
        title: "Static SVG, at build time",
        lang: "tsx",
        code: `import { ditherPath } from "@forgeron/shaders";

// A ramp from left to right, 64 × 12 cells.
const d = ditherPath(64, 12, (x) => x / 63, 8);

<svg viewBox="0 0 64 12" shapeRendering="crispEdges" fill="currentColor">
  <path d={d} />
</svg>`,
      },
      {
        title: "In your own loop",
        lang: "tsx",
        code: `import { bayer } from "@forgeron/shaders";

// on when the tone beats the threshold of this pixel
const on = tone > bayer(x, y, 8);`,
      },
    ],
  },
  "image-dither": {
    summary: "A picture to five greys and the ember, through the 4×4 Bayer matrix.",
    what: [
      "Luminance picks between two neighbouring greys through the 4×4 Bayer threshold.",
      "Warm pixels (red well above green and blue) become ember over the background.",
      "Its source is a picture from the page: the demos go through `mountDitheredImage`.",
    ],
    agreement: "within a stated share: luminance is float",
    mount: true,
    extra: IMAGES.slice(1),
  },
  palette: {
    summary: "Tone indices to colours: tokens of the page, or colours.",
    what: [
      "The last cell pass: tone `i` takes `tones[i]`, a CSS token read on the canvas (with a fallback) or a colour.",
      "`transparent` lists the tones that let the page under the canvas show through.",
    ],
    agreement: "exact: 0 pixels differ",
    preset: "field-ember",
    versions: [
      [
        "Greys",
        "--bg, --line-strong, --ink-dim",
        {
          tones: [
            { var: "--bg", fallback: "#0d0d0d" },
            { var: "--line-strong", fallback: "#3a3a3a" },
            { var: "--ink-dim", fallback: "#575757" },
          ],
        },
      ],
    ],
  },
  grid: {
    summary: "A gap on the right and top edge of each cell.",
    what: [
      "A present pass: it runs last, at output resolution, so the gap is in device pixels.",
      "Cells under `min` CSS pixels keep no gap.",
    ],
    agreement: "exact: 0 pixels differ",
    preset: "field-ember",
    versions: [
      ["Wide gap", "gap 0.3", { gap: 0.3 }],
      ["No gap", "gap 0", { gap: 0 }],
    ],
  },
  glow: {
    summary: "A dithered halo around the ember cells, as Blueprint's glow.",
    what: [
      "On tone indices before the palette: the share of glowing cells around a cell, through a binomial kernel of `radius`; the ember of a field sits inside ink, so the halo covers both.",
      "Separable: a horizontal then a vertical sum, two stages on the GPU.",
      "Above the Bayer threshold, a background cell takes the halo's tone: whole pixels, never a blur.",
    ],
    agreement: "exact: whole sums over a power of two, 0 pixels differ",
    versions: [["Wide", "radius 4, strength 5, matrix 8", { radius: 4, strength: 5, matrix: 8 }]],
  },
  hatch: {
    summary: "Diagonal stripes of whole cells that drift: the rail of the landing.",
    what: [
      "A cell is striped when (x ± y + the drift) mod `period` is under `width`; the area is a rectangle given as shares of the frame.",
      "In the Progress and Selection examples.",
    ],
    agreement: "exact: 0 pixels differ",
    versions: [["Selection", "period 6, width 1, up", { period: 6, width: 1, direction: "up" }]],
  },
  dissolve: {
    summary: "Cells switch to one tone in Bayer order: a pixel transition, never a fade.",
    what: [
      "As the progress grows, the cells whose Bayer threshold is under it take `tone`; with `cycle` the progress goes there and back.",
      "Dissolve into a transparent tone and the page under the canvas shows through: the Transition example.",
    ],
    agreement: "exact when held; tolerance 0.5 % of pixels on a cycle (measured 0)",
    versions: [["Held", "progress 0.5", { cycle: 0, progress: 0.5 }]],
  },
  ring: {
    summary: "A ring of pixels spreads from a point and dies out.",
    what: [
      "The radius grows with the age; a cell near it is drawn where the Bayer threshold is under its closeness times the life left.",
      "One tone per slice of its life: bright at birth, dim at the end. The Feedback example.",
    ],
    agreement: "tolerance 1 % of pixels (measured 0)",
    versions: [["Wide", "width 4, life 1.5", { width: 4, life: 1.5 }]],
  },
  sparks: {
    summary: "Embers and flying sparks along the edge of a front, on a slow tick.",
    what: [
      "Reads the distance and life a `front` source writes, and catches cells near the edge with a chance that falls with their depth.",
      "An integer hash (24 bits, exact in float32) gives the same embers on the GPU and the CPU. With `front`, the burns.",
    ],
    agreement: "tolerance 3 % of pixels (measured 0 to 0.014 %): the front's distance is float",
    versions: [["Sparse", "density 0.25, no flying sparks", { density: 0.25, fly: 0 }]],
  },
  reveal: {
    summary: "Tones appear along a Bayer-jittered front that scans the rows.",
    what: [
      "The front goes down the rows, left to right in each row; a cell wears the `front` tones before it settles in its own.",
      "The cell-local form of the Title example's reveal, which also shifts pixels with a wave.",
    ],
    agreement: "tolerance 1 % of pixels (measured 0)",
    versions: [["Slow", "duration 3", { duration: 3 }]],
  },
};

/** Sources whose built-in presets need page data: never the default preset of another step. */
const NEEDS_DATA = new Set(["image", "tone", "hearth"]);

const title = (type: string) =>
  type.charAt(0).toUpperCase() + type.slice(1).replace(/-(\w)/g, (_, c: string) => ` ${c}`);
const camel = (type: string) => type.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** The built-in preset a step is shown on. */
function presetFor(ref: StepRef, note: Note): string {
  if (note.preset) return note.preset;
  const all = builtInPresets();
  if (all[ref.type] && hasStep(all[ref.type]!, ref)) return ref.type;
  const found = Object.entries(all).find(
    ([, p]) => !NEEDS_DATA.has(p.source.type) && hasStep(p, ref),
  );
  if (!found) throw new Error(`no built-in preset shows the ${ref.on} "${ref.type}"`);
  return found[0];
}

/** Which of `xMeta`, `xGlsl`, `xCpu`, `xStep` the package exports for a step. */
const partsOf = (type: string): string[] =>
  ["Meta", "Glsl", "Cpu", "Step"].map((p) => camel(type) + p).filter((n) => n in shaders);

function page(ref: StepRef, note: Note): Omit<Shader, "usedBy"> {
  const def = ref.on === "source" ? SOURCES[ref.type]! : PASSES[ref.type]!;
  const gpu = def.glsl !== null;
  const name = note.name ?? title(ref.type);
  const presetName = note.mount ? null : presetFor(ref, note);
  const preset: Preset | null = presetName ? builtIn(presetName) : null;
  const parts = partsOf(ref.type);
  const kind = ref.on === "pass" ? ` A ${PASSES[ref.type]!.kind} pass.` : "";
  const live: Version[] = preset
    ? [
        {
          title: "Live",
          note: `every setting, on "${presetName}"`,
          demo: { kind: "preset", preset, edit: ref, live: true },
        },
        ...(note.versions ?? []).map(([t, n, params]) => ({
          title: t,
          note: n,
          demo: { kind: "preset" as const, preset: withStep(preset, ref, params) },
        })),
      ]
    : [];
  return {
    slug: `${ref.on}-${ref.type}`,
    group: "primitive",
    name,
    summary: note.summary ?? def.description,
    engine: gpu ? "GLSL + CPU" : "CPU only",
    home: `@forgeron/shaders: ${parts.join(", ")}`,
    chain: preset ? chainText(preset) : ref.type,
    what: [
      ...(note.what ?? [def.description]),
      `${gpu ? "Both sides: GLSL and CPU, with the same result." : "CPU only: a preset with it runs on a 2D canvas."}${kind}`,
      ...(note.agreement ? [`CPU against GLSL: ${note.agreement}.`] : []),
    ],
    uses: [],
    versions: [...live, ...(note.extra ?? [])],
    code: [
      {
        title: `In a preset, with its defaults`,
        lang: "tsx",
        code: JSON.stringify(defaultStep(ref), null, 2),
      },
      {
        title: "One side per page",
        lang: "tsx",
        code: `import { ${parts.join(", ")} } from "@forgeron/shaders";

${parts
  .map((p) =>
    p.endsWith("Meta")
      ? `// ${p}: description and params schema (validation, the editor)`
      : p.endsWith("Glsl")
        ? `// ${p}: the GPU side, for bindChain then glPipeline`
        : p.endsWith("Cpu")
          ? `// ${p}: the CPU side, for bindChain then runCpu`
          : `// ${p}: both sides (the pipeline reads it)`,
  )
  .join("\n")}`,
      },
      ...(note.code ?? []),
      ...(presetName ? presetCode(presetName) : []),
    ],
    options: optionsOf(ref),
  };
}

/** Sources first (where a chain starts), then passes, in the registry's order. */
export const primitives: Omit<Shader, "usedBy">[] = [
  ...Object.keys(SOURCES).map((type) => page({ on: "source", type }, SOURCE_NOTES[type] ?? {})),
  ...Object.keys(PASSES).map((type) => page({ on: "pass", type }, PASS_NOTES[type] ?? {})),
];

/** The step a primitive page is about. */
export const refOf = (slug: string): StepRef => {
  const [on, ...rest] = slug.split("-");
  return { on: on as StepRef["on"], type: rest.join("-") };
};
