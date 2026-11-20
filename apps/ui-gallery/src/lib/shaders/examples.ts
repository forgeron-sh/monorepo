// The examples: the real cases, each a built-in preset of @forgeron/shaders (a role of the
// language, docs/shaders/design.md §0, or a burn). Written by hand: what it is for, where
// Forgeron draws it, its versions and the component that wraps it. The chain, the engine, the
// JSON and the live controls come from the preset.

import { ditherFieldPreset, fieldPreset, type Preset } from "@forgeron/shaders";
import {
  builtIn,
  chainText,
  drivenCode,
  engineOf,
  optionsOf,
  presetCode,
  withStep,
} from "./snippets";
import type { Option, Shader, Snippet, StepRef, Use, Version } from "./types";

interface Example {
  slug: string;
  name: string;
  summary: string;
  /** The built-in preset it is. */
  preset: string;
  /** The step its live version edits; none when its demos are mounts. */
  edit?: StepRef;
  what: string[];
  uses: Use[];
  /** Beside the live version (or instead of it, for a mount). */
  versions: Version[];
  /** The component or mount that wraps it, before the preset's own code. */
  code?: Snippet[];
  options?: Option[];
  /** For a mount: how it is drawn. */
  engine?: string;
  /** Drawn under the live version (the burns: what shows through). */
  under?: Preset;
}

const NOT_YET: Use[] = [
  { site: "Gallery", place: "This page (not yet on a site)", settings: "built-in preset" },
];

const STILL: Option = {
  name: "still",
  type: "boolean",
  description: "One frame at t = 0. Without it, the reader's prefers-reduced-motion decides.",
};

/** A look of the preset with one step changed. */
const look = (
  name: string,
  ref: StepRef,
  t: string,
  note: string,
  params: Record<string, unknown>,
): Version => ({
  title: t,
  note,
  demo: { kind: "preset", preset: withStep(builtIn(name), ref, params) },
});

const FIELD: StepRef = { on: "source", type: "field" };
const FRONT: StepRef = { on: "source", type: "front" };
const VILLAGE = fieldPreset({ mode: "globe" });

const EXAMPLES: Example[] = [
  {
    slug: "background",
    name: "Background",
    summary: "The grain behind a hero or a banner: whole pixels, alive, never a blur.",
    preset: "role-background",
    edit: FIELD,
    what: [
      "Fractal noise through the 8×8 Bayer threshold, in the background, ink and line tones; one fragment shader for the four fields.",
      "Five looks: the quiet field, the globe, the ember field (the one place it turns orange), the dissolve bands and the CPU dither field of the sub-sites.",
      "Animates only on screen; one still frame under reduced motion; blank where WebGL is missing.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Home hero, behind the village (.saga-bg)",
        settings: 'data-shader="field" data-px="4" data-accent="off" · opacity 6 %, screen',
      },
      {
        site: "forgeron.sh",
        place: "Home, the closing call to action (.cta-glow)",
        settings: 'data-shader="ember" data-px="8"',
      },
      {
        site: "forgeron.sh",
        place: "Pricing, the network block (.net-art)",
        settings: 'data-shader="globe" data-px="4"',
      },
      {
        site: "forgeron.sh",
        place: "Pricing, the closing band",
        settings: 'data-shader="dissolve" data-px="8"',
      },
      {
        site: "ui, icon and font galleries",
        place: "The home heroes",
        settings: 'canvas[data-dither] data-px="4" (5 on the font specimen)',
      },
    ],
    versions: [
      {
        title: "Hero, as shown",
        note: "field · accent off · opacity 0.06, screen",
        demo: { kind: "preset", preset: builtIn("role-background"), faint: true },
      },
      {
        title: "Globe",
        note: "pixel 4",
        demo: { kind: "preset", preset: builtIn("field-globe") },
      },
      {
        title: "Ember",
        note: "pixel 8",
        demo: { kind: "preset", preset: fieldPreset({ mode: "ember", pixel: 8 }) },
      },
      {
        title: "Dissolve",
        note: "pixel 8",
        demo: { kind: "preset", preset: fieldPreset({ mode: "dissolve", pixel: 8 }) },
      },
      {
        title: "Dither field",
        note: "heat on the CPU · pixel 4",
        demo: { kind: "preset", preset: builtIn("dither-field") },
      },
      {
        title: "Dither field, greys",
        note: 'tones={["--bg", "--line-strong", "--ink-dim"]}',
        demo: {
          kind: "preset",
          preset: ditherFieldPreset(["--bg", "--line-strong", "--ink-dim"]),
        },
      },
    ],
    code: [
      {
        title: "React",
        lang: "tsx",
        code: `import { DitherField, FieldShader } from "@forgeron/ui";

// The canvas fills its box: size the box.
<div style={{ position: "relative", height: 320 }}>
  <FieldShader mode="field" pixel={4} accent={false} />
</div>

<DitherField pixel={4} />`,
      },
      {
        title: "forgeron.sh (Astro, @forgeron/blueprint)",
        lang: "tsx",
        code: `<canvas class="saga-bg" data-shader="field" data-px="4" data-accent="off" aria-hidden="true"></canvas>

<style>
  .saga-bg { opacity: 0.06; mix-blend-mode: screen; }
</style>`,
      },
    ],
    options: [
      {
        name: "mode",
        type: '"ember" | "globe" | "dissolve" | "field"',
        description: "Which field (<FieldShader>).",
      },
      {
        name: "pixel",
        type: "number",
        default: "4",
        description: "Cell side in CSS pixels. From 4, cells keep a one-pixel gap.",
      },
      {
        name: "accent",
        type: "boolean",
        default: "true",
        description: "false draws the brightest cells in ink instead of the ember.",
      },
      {
        name: "tones",
        type: "[string, string, string]",
        default: '["--bg", "--line-strong", "--accent"]',
        description: "<DitherField>: background, low and high tones, tokens or colours.",
      },
      {
        name: "pointer",
        type: "boolean",
        default: "true",
        description: "<FieldShader>: follows the pointer over the canvas's parent.",
      },
      STILL,
    ],
  },
  {
    slug: "title",
    name: "Title",
    summary: "A title that appears pixel by pixel, in about a second and a half.",
    preset: "role-title",
    engine: "Canvas 2D",
    what: [
      "A raster scan: rows start top to bottom, each swept left to right; near the slanted front, pixels shift and step ember, dark ember, dim, muted, then ink.",
      "The preset is the cell-local form (a `tone` mask through `reveal`); the mount, `mountReveal`, adds the wave and stays.",
      "The text is in the page from the start; under reduced motion it simply stays.",
    ],
    uses: [
      {
        site: "font.forgeron.sh",
        place: "Specimen hero, the title “Forgeron Sans”",
        settings: "mountReveal · 1.5 s",
      },
    ],
    versions: [
      { title: "Short title", note: "pixel 10", demo: { kind: "reveal", text: "UI", pixel: 10 } },
      { title: "Wordmark", note: "pixel 5", demo: { kind: "reveal", text: "Forgeron", pixel: 5 } },
      {
        title: "Slow",
        note: "pixel 5 · 3000 ms",
        demo: { kind: "reveal", text: "Shaders", pixel: 5, duration: 3000 },
      },
    ],
    code: [
      {
        title: "React",
        lang: "tsx",
        code: `import { PixelReveal } from "@forgeron/ui";

<h1>
  <PixelReveal text="Forgeron" pixel={8} />
</h1>`,
      },
      {
        title: "Plain DOM",
        lang: "tsx",
        code: `import { mountReveal, textRows } from "@forgeron/ui";

mountReveal(canvas, [textRows("Forgeron"), textRows("Sans")], {
  pixel: 8,
  onDone: () => canvas.remove(),
});`,
      },
    ],
    options: [
      { name: "text", type: "string", description: "One line, in the pixel face's capitals." },
      { name: "pixel", type: "number", default: "8", description: "CSS pixels per font pixel." },
      {
        name: "duration",
        type: "number",
        default: "1500",
        description: "Milliseconds; 1.3 to 1.8 s for a hero title.",
      },
      STILL,
      { name: "replay", type: "number", description: "Changing it plays the reveal again." },
    ],
  },
  {
    slug: "image",
    name: "Image",
    summary: "A picture or a capture, redrawn in five greys and the ember.",
    preset: "role-image",
    engine: "Canvas 2D",
    what: [
      "Luminance through the 4×4 Bayer matrix to five greys; the ember only where the picture is warm.",
      "Cropped to cover the canvas, one dithered pixel per 3 CSS pixels: whatever made the picture, it comes out in the system.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Landing exploration D, the hero picture (not on a live page today)",
        settings: 'canvas[data-dither-img="/lab/hero-forge.png"] data-px="3"',
      },
    ],
    versions: [
      { title: "Hero", note: "pixel 3 · gain 1.1", demo: { kind: "image", pixel: 3, gain: 1.1 } },
      { title: "Source", note: "the picture, before", demo: { kind: "image", raw: true } },
      { title: "Coarse", note: "pixel 5", demo: { kind: "image", pixel: 5 } },
    ],
    code: [
      {
        title: "React",
        lang: "tsx",
        code: `import { DitheredImage } from "@forgeron/ui";

<div style={{ height: 320 }}>
  <DitheredImage src="/hero.png" pixel={3} />
</div>`,
      },
      {
        title: "Plain DOM",
        lang: "tsx",
        code: `import { mountDitheredImage } from "@forgeron/ui";

mountDitheredImage(canvas, "/hero.png", { pixel: 3, gain: 1.1 });`,
      },
    ],
    options: [
      {
        name: "src",
        type: "string",
        description: "The picture. On a load error the canvas hides itself.",
      },
      {
        name: "pixel",
        type: "number",
        default: "3",
        description: "Side of one dithered pixel in CSS pixels.",
      },
      {
        name: "gain",
        type: "number",
        default: "1.1",
        description: "Luminance gain before dithering.",
      },
    ],
  },
  {
    slug: "transition",
    name: "Transition",
    summary: "A screen or a state dissolves into the next, pixel by pixel.",
    preset: "role-transition",
    edit: { on: "pass", type: "dissolve" },
    what: [
      "The cells switch off in Bayer order as the progress grows; with a transparent tone, the page under the canvas shows through.",
      "One canvas over the next screen: no second scene, never a fade.",
    ],
    uses: NOT_YET,
    versions: [
      look("role-transition", { on: "pass", type: "dissolve" }, "Held", "progress 0.5", {
        cycle: 0,
        progress: 0.5,
      }),
    ],
  },
  {
    slug: "progress",
    name: "Progress",
    summary: "Loading, upload, build: the hatched rail that fills.",
    preset: "role-progress",
    edit: { on: "pass", type: "hatch" },
    what: [
      "The filled part drifts in diagonal hatch, the rest of the rail is a sparse hatch; the area is a rectangle of the frame.",
      "The same hatched stripes as the rails of the landing, moving.",
    ],
    uses: NOT_YET,
    versions: [],
  },
  {
    slug: "ember",
    name: "Ember",
    summary: "The footer: the wordmark as hot iron, the one place where orange rises.",
    preset: "role-ember",
    engine: "Canvas 2D",
    what: [
      "Cells of five tones by the 8×8 Bayer matrix: iron letters, white hot then ember at their foot, on a bed of embers with a few rising sparks; the pointer is the bellows.",
      "Orange here and on the anvil only: the rest of the language stays grey.",
      "Without JavaScript the wordmark stands in cold iron at the same place.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Footer of every page, under the site index",
        settings: "mountHearth(footer) · cells of 4 px, 2 px under 560 px",
      },
    ],
    versions: [
      { title: "Footer", note: "cell 4", demo: { kind: "hearth", text: "Forgeron", cell: 4 } },
      { title: "Narrow", note: "cell 2", demo: { kind: "hearth", text: "Forgeron", cell: 2 } },
      {
        title: "Another word",
        note: 'text="Forge"',
        demo: { kind: "hearth", text: "Forge", cell: 4 },
      },
      {
        title: "Still",
        note: "still",
        demo: { kind: "hearth", text: "Forgeron", cell: 4, still: true },
      },
    ],
    code: [
      {
        title: "React",
        lang: "tsx",
        code: `import { Hearth } from "@forgeron/ui";

<Hearth text="Forgeron">
  <nav className="footer-links">…</nav>
</Hearth>`,
      },
      {
        title: "Astro, plain DOM",
        lang: "tsx",
        code: `<div class="fg-hearth" data-hearth>
  <canvas aria-hidden="true"></canvas>
  <nav>…</nav>
  <div class="fg-hearth-word" data-hearth-word><PixelText text="forgeron" /></div>
</div>

<script>
  import { mountHearth } from "@forgeron/ui";

  const hearth = document.querySelector<HTMLElement>("[data-hearth]");
  if (hearth) mountHearth(hearth);
</script>`,
      },
    ],
    options: [
      {
        name: "text",
        type: "string",
        default: '"Forgeron"',
        description: "The wordmark, in the pixel face's capitals.",
      },
      {
        name: "cell",
        type: "number",
        default: "4, 2 under 560 px",
        description: "Cell side in CSS pixels.",
      },
      STILL,
      {
        name: "children",
        type: "ReactNode",
        description: "Content laid over the embers, above the wordmark.",
      },
    ],
  },
  {
    slug: "selection",
    name: "Selection",
    summary: "The chosen area in the editors: a marching hatch.",
    preset: "role-selection",
    edit: { on: "pass", type: "hatch" },
    what: [
      "A diagonal hatch that walks inside the chosen rectangle; the line and the corner brackets are still to come.",
      "For the canvas editors: flow, draw, richtext blocks.",
    ],
    uses: NOT_YET,
    versions: [],
  },
  {
    slug: "feedback",
    name: "Feedback",
    summary: "A click, a success, an error: a ring of pixels, then nothing.",
    preset: "role-feedback",
    edit: { on: "pass", type: "ring" },
    what: [
      "A ring spreads from the point, bright at birth and dim at the end, switching cells on and off whole.",
      "It dies out on its own: nothing to dismiss, nothing left on screen.",
    ],
    uses: NOT_YET,
    versions: [],
  },
  {
    slug: "burn-frame",
    name: "Frame burn",
    summary: "A rectangle of fire that closes onto a band, or opens out of it.",
    preset: "burn-frame-close",
    edit: FRONT,
    under: VILLAGE,
    what: [
      "A rectangle closes from the whole frame onto a band; outside it the page. Run backwards, the band opens out to the whole frame and lets the picture in.",
      "Across the front, a two-ring fringe dithered by the 4×4 Bayer matrix in 4 px cells: outer ring 5 cells of 16 left, inner 11.",
      "Embers along the four edges on a slow tick: white hot, ember and red. Here a globe field stands in for the site's village.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Home, the end of the story: the village burns onto the hero band",
        settings: "burn-frame-close · driven by the scroll",
      },
      {
        site: "Gallery",
        place: "This page: the open direction",
        settings: "burn-frame-open · not yet on a site",
      },
    ],
    versions: [
      {
        title: "Open",
        note: "the picture is let in from the band",
        demo: { kind: "preset", preset: builtIn("burn-frame-open"), under: VILLAGE },
      },
    ],
    code: [drivenCode("burn-frame-close")],
    options: [...optionsOf(FRONT), ...optionsOf({ on: "pass", type: "sparks" })],
  },
  {
    slug: "burn-lobed",
    name: "Lobed burn",
    summary: "A ring of fire with drifting lobes that spreads from the centre, or closes onto it.",
    preset: "burn-lobed-open",
    edit: FRONT,
    under: VILLAGE,
    what: [
      "The picture spreads from the centre behind a lobed front whose lobes drift. Run backwards, the front closes on the centre and burns the picture away.",
      "The same two-ring Bayer fringe, widening from 12 px a ring at the centre to 24 near the edges.",
      "Embers in white and greys only, so the two burns do not look alike.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Home, the opening story: the village appears on load",
        settings: "burn-lobed-open · 1.9 s",
      },
      {
        site: "Gallery",
        place: "This page: the close direction",
        settings: "burn-lobed-close · not yet on a site",
      },
    ],
    versions: [
      {
        title: "Close",
        note: "the picture burns away to the centre",
        demo: { kind: "preset", preset: builtIn("burn-lobed-close"), under: VILLAGE },
      },
    ],
    code: [drivenCode("burn-lobed-open")],
    options: [...optionsOf(FRONT), ...optionsOf({ on: "pass", type: "sparks" })],
  },
];

function page(e: Example): Omit<Shader, "usedBy"> {
  const preset = builtIn(e.preset);
  const live: Version[] = e.edit
    ? [
        {
          title: "Live",
          note: `every setting of its ${e.edit.type} ${e.edit.on}`,
          demo: { kind: "preset", preset, edit: e.edit, live: true, under: e.under },
        },
      ]
    : [];
  return {
    slug: e.slug,
    group: "example",
    name: e.name,
    summary: e.summary,
    engine: e.engine ?? engineOf(preset),
    home: `@forgeron/shaders: builtInPresets()["${e.preset}"]`,
    chain: chainText(preset),
    what: e.what,
    uses: e.uses,
    versions: [...live, ...e.versions],
    code: [...(e.code ?? []), ...presetCode(e.preset, !e.edit)],
    options: e.options ?? (e.edit ? optionsOf(e.edit) : []),
  };
}

export const examples: Omit<Shader, "usedBy">[] = EXAMPLES.map(page);

/** The preset of each example, for the primitives' "Used by". */
export const examplePresets: Record<string, Preset> = Object.fromEntries(
  EXAMPLES.map((e) => [e.slug, builtIn(e.preset)]),
);
