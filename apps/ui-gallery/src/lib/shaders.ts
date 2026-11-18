// The Shaders section: every pixel field and effect Forgeron draws online, where it runs, its
// versions and how to use it. The demos are `components/shaders/ShaderDemo.tsx` (an island per
// demo) or static SVG drawn at build time (`ramp`, `anvil`).

type FieldMode = "ember" | "globe" | "dissolve" | "field";

export type DemoSpec =
  | { kind: "ramp"; n: 2 | 4 | 8 }
  | { kind: "anvil"; mode: "dither" | "fade" }
  | { kind: "dither-field"; pixel?: number; tones?: [string, string, string]; still?: boolean }
  | {
      kind: "field";
      mode: FieldMode;
      pixel?: number;
      accent?: boolean;
      still?: boolean;
      /** Drawn as on the site's hero: faint, blended as a screen. */
      opacity?: number;
    }
  | { kind: "image"; pixel?: number; gain?: number; raw?: boolean }
  | { kind: "hearth"; text?: string; cell?: number; still?: boolean }
  | { kind: "reveal"; text: string; pixel?: number; duration?: number }
  | { kind: "burn"; mode: "close" | "open" };

interface Version {
  title: string;
  /** The settings, as written where it runs. */
  note: string;
  demo: DemoSpec;
}

interface Use {
  site: string;
  place: string;
  settings: string;
}

interface Snippet {
  title: string;
  lang: "tsx" | "css" | "shellscript";
  code: string;
}

interface Option {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface Shader {
  slug: string;
  name: string;
  summary: string;
  /** How it is drawn. */
  engine: "WebGL" | "Canvas 2D" | "SVG" | "SVG or canvas";
  /** Where its code lives. */
  home: string;
  what: string[];
  uses: Use[];
  versions: Version[];
  code: Snippet[];
  options: Option[];
}

const STILL: Option = {
  name: "still",
  type: "boolean",
  description: "One frame at t = 0. Without it, the reader's prefers-reduced-motion decides.",
};

const fieldOptions: Option[] = [
  { name: "mode", type: '"ember" | "globe" | "dissolve" | "field"', description: "Which field." },
  {
    name: "pixel",
    type: "number",
    default: "4",
    description:
      "Cell side in CSS pixels, times the device pixel ratio (capped at 2). From 4, cells keep a one-pixel gap.",
  },
  {
    name: "accent",
    type: "boolean",
    default: "true",
    description: "false draws the brightest cells in ink instead of the ember.",
  },
  {
    name: "bg · ink · ember",
    type: "string",
    default: "--bg · --ink · --accent",
    description: "The three tones: a token read on the canvas, or a colour.",
  },
  {
    name: "pointer",
    type: "boolean",
    default: "true",
    description: "Follows the pointer over the canvas's parent (ember leans towards it).",
  },
  STILL,
];

const fieldCode = (mode: FieldMode, extra: string, site: string): Snippet[] => [
  {
    title: "React",
    lang: "tsx",
    code: `import { FieldShader } from "@forgeron/ui";

// The canvas fills its box: size the box.
<div style={{ position: "relative", height: 320 }}>
  <FieldShader mode="${mode}"${extra} />
</div>`,
  },
  {
    title: "Plain DOM",
    lang: "tsx",
    code: `import { mountFieldShader } from "@forgeron/ui";

const field = mountFieldShader(canvas, { mode: "${mode}"${extra.replace(/ (\w+)=\{?([^ }]+)\}?/g, ", $1: $2")} });
// later: field?.destroy();`,
  },
  {
    title: "forgeron.sh (Astro, @forgeron/blueprint)",
    lang: "tsx",
    code: site,
  },
];

const fieldWhat = (line: string): string[] => [
  line,
  "One WebGL fragment shader for the four fields (FIELD_FRAGMENT): fractal noise, then the 8×8 Bayer threshold to three tones.",
  "Animates only on screen; one still frame under reduced motion; blank where WebGL is missing.",
];

export const shaders: Shader[] = [
  {
    slug: "ordered-dither",
    name: "Ordered dither",
    summary: "The Bayer matrix every other shader thresholds with.",
    engine: "SVG or canvas",
    home: "@forgeron/blueprint (bayer), re-exported by @forgeron/ui with ditherPath",
    what: [
      "A tone in [0, 1] becomes a pixel on or off: on when it beats the matrix at that position.",
      "2×2, 4×4 and 8×8, built by one recurrence: one generator, every table the sites carried.",
      "No blur, no alpha: a gradient is a density of whole pixels.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Every isometric illustration",
        settings: "pixelate(3) → dither({ matrix: 4 }) → palette",
      },
      {
        site: "Logo",
        place: "The anvil, dither and fade renderings",
        settings: "anvilPath(n, mode)",
      },
      {
        site: "Every shader of this section",
        place: "Their threshold",
        settings: "bayer(x, y, 8), or 4 for images and the burn",
      },
    ],
    versions: [
      { title: "2×2", note: "bayer(x, y, 2)", demo: { kind: "ramp", n: 2 } },
      { title: "4×4", note: "bayer(x, y, 4)", demo: { kind: "ramp", n: 4 } },
      { title: "8×8", note: "bayer(x, y, 8)", demo: { kind: "ramp", n: 8 } },
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
        code: `import { ditherPath } from "@forgeron/ui";

// A ramp from left to right, 64 × 12 cells.
const d = ditherPath(64, 12, (x) => x / 63, 8);

<svg viewBox="0 0 64 12" shapeRendering="crispEdges" fill="currentColor">
  <path d={d} />
</svg>`,
      },
      {
        title: "In your own loop",
        lang: "tsx",
        code: `import { bayer } from "@forgeron/ui";

// on when the tone beats the threshold of this pixel
const on = tone > bayer(x, y, 8);`,
      },
    ],
    options: [
      {
        name: "bayer(x, y, n)",
        type: "(number, number, 2 | 4 | 8) => number",
        default: "n = 4",
        description: "Threshold of a pixel, in [0, 1).",
      },
      {
        name: "ditherPath(cols, rows, tone, n)",
        type: "(number, number, (x, y) => number, 2 | 4 | 8) => string",
        default: "n = 8",
        description: "SVG path of the cells drawn, one unit each, viewBox 0 0 cols rows.",
      },
    ],
  },
  {
    slug: "dither-field",
    name: "Dither field",
    summary: "A slow ember heat in three tones, on the CPU.",
    engine: "Canvas 2D",
    home: "@forgeron/ui (mountDitherField, <DitherField>); copied today in apps/font, apps/icon-gallery, apps/ui-gallery",
    what: [
      "Heat rising from the bottom right, stirred by two slow waves.",
      "Three tones by the 8×8 Bayer matrix: background, strong line, ember.",
      "About 12 frames a second: the field steps, it does not glide. One canvas pixel per cell, scaled up crisp.",
    ],
    uses: [
      {
        site: "ui.forgeron.sh",
        place: "Home hero, right half",
        settings: 'canvas[data-dither] data-px="4"',
      },
      { site: "Icon gallery", place: "Home hero", settings: 'canvas[data-dither] data-px="4"' },
      {
        site: "font.forgeron.sh",
        place: "Specimen hero",
        settings: 'canvas[data-dither] data-px="5"',
      },
    ],
    versions: [
      { title: "Hero", note: "pixel 4", demo: { kind: "dither-field", pixel: 4 } },
      { title: "Specimen", note: "pixel 5", demo: { kind: "dither-field", pixel: 5 } },
      { title: "Coarse", note: "pixel 8", demo: { kind: "dither-field", pixel: 8 } },
      {
        title: "Greys",
        note: 'tones={["--bg", "--line-strong", "--ink-dim"]}',
        demo: { kind: "dither-field", pixel: 4, tones: ["--bg", "--line-strong", "--ink-dim"] },
      },
    ],
    code: [
      {
        title: "React",
        lang: "tsx",
        code: `import { DitherField } from "@forgeron/ui";

<div className="hero" style={{ position: "relative" }}>
  <DitherField pixel={4} className="hero-dither" />
</div>`,
      },
      {
        title: "Astro, plain DOM",
        lang: "tsx",
        code: `<canvas class="hero-dither" data-dither data-px="4" aria-hidden="true"></canvas>

<script>
  import { mountDitherField } from "@forgeron/ui";

  for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-dither]"))
    mountDitherField(c, { pixel: Number(c.dataset.px ?? 4) });
</script>`,
      },
      {
        title: "A frame, without a canvas",
        lang: "tsx",
        code: `import { ditherFieldFrame, FIELD_HIGH } from "@forgeron/ui";

// 0 background, 1 low, 2 high, row by row: deterministic, testable.
const tones = ditherFieldFrame(120, 80, 2.5);`,
      },
    ],
    options: [
      { name: "pixel", type: "number", default: "4", description: "Cell side in CSS pixels." },
      {
        name: "tones",
        type: "[string, string, string]",
        default: '["--bg", "--line-strong", "--accent"]',
        description: "Background, low and high tones: tokens read on the canvas, or colours.",
      },
      {
        name: "fps",
        type: "number",
        default: "12",
        description: "Frames a second while on screen.",
      },
      STILL,
    ],
  },
  {
    slug: "ember",
    name: "Ember",
    summary: "Fire rising through fractal noise; it leans towards the pointer.",
    engine: "WebGL",
    home: "@forgeron/blueprint (FIELD_FRAGMENT); glue in @forgeron/ui (mountFieldShader, <FieldShader>) and @forgeron/blueprint/dom (mountField)",
    what: fieldWhat(
      "Heat from the bottom edge, the brightest cells in ember, the pointer as a bellows.",
    ),
    uses: [
      {
        site: "forgeron.sh",
        place: "Home, the closing call to action (.cta-glow)",
        settings: 'data-shader="ember" data-px="8"',
      },
    ],
    versions: [
      {
        title: "Call to action",
        note: "pixel 8",
        demo: { kind: "field", mode: "ember", pixel: 8 },
      },
      { title: "Fine", note: "pixel 4", demo: { kind: "field", mode: "ember", pixel: 4 } },
      {
        title: "Ink only",
        note: "pixel 4 · accent off",
        demo: { kind: "field", mode: "ember", pixel: 4, accent: false },
      },
    ],
    code: fieldCode(
      "ember",
      " pixel={8}",
      '<canvas class="cta-glow" data-shader="ember" data-px="8" aria-hidden="true"></canvas>',
    ),
    options: fieldOptions,
  },
  {
    slug: "field",
    name: "Field",
    summary: "Drifting noise in ink: the quiet backdrop.",
    engine: "WebGL",
    home: "@forgeron/blueprint (FIELD_FRAGMENT); glue in @forgeron/ui and @forgeron/blueprint/dom",
    what: fieldWhat("Slow fractal noise drifting across the frame, no heat, no pointer."),
    uses: [
      {
        site: "forgeron.sh",
        place: "Home hero, behind the village (.saga-bg)",
        settings: 'data-shader="field" data-px="4" data-accent="off" · opacity 6 %, screen blend',
      },
    ],
    versions: [
      {
        title: "Hero, full strength",
        note: "pixel 4 · accent off",
        demo: { kind: "field", mode: "field", pixel: 4, accent: false },
      },
      {
        title: "Hero, as shown",
        note: "pixel 4 · accent off · opacity 0.06, screen",
        demo: { kind: "field", mode: "field", pixel: 4, accent: false, opacity: 0.06 },
      },
      {
        title: "Coarse, with ember",
        note: "pixel 8",
        demo: { kind: "field", mode: "field", pixel: 8 },
      },
    ],
    code: fieldCode(
      "field",
      " pixel={4} accent={false}",
      '<canvas class="saga-bg" data-shader="field" data-px="4" data-accent="off" aria-hidden="true"></canvas>\n\n<style>\n  .saga-bg { opacity: 0.06; mix-blend-mode: screen; }\n</style>',
    ),
    options: fieldOptions,
  },
  {
    slug: "globe",
    name: "Globe",
    summary: "A lit sphere turning, rising from the bottom edge.",
    engine: "WebGL",
    home: "@forgeron/blueprint (FIELD_FRAGMENT); glue in @forgeron/ui and @forgeron/blueprint/dom",
    what: fieldWhat(
      "A sphere lit from the top left, its surface textured by noise that turns with time.",
    ),
    uses: [
      {
        site: "forgeron.sh",
        place: "Pricing, the network block (.net-art)",
        settings: 'data-shader="globe" data-px="4"',
      },
    ],
    versions: [
      { title: "Network", note: "pixel 4", demo: { kind: "field", mode: "globe", pixel: 4 } },
      { title: "Coarse", note: "pixel 8", demo: { kind: "field", mode: "globe", pixel: 8 } },
      {
        title: "Ink only",
        note: "pixel 4 · accent off",
        demo: { kind: "field", mode: "globe", pixel: 4, accent: false },
      },
    ],
    code: fieldCode(
      "globe",
      " pixel={4}",
      '<div class="net-art"><canvas data-shader="globe" data-px="4" aria-hidden="true"></canvas></div>',
    ),
    options: fieldOptions,
  },
  {
    slug: "dissolve",
    name: "Dissolve",
    summary: "Bands of cells eaten from the left, their edge drifting.",
    engine: "WebGL",
    home: "@forgeron/blueprint (FIELD_FRAGMENT); glue in @forgeron/ui and @forgeron/blueprint/dom",
    what: fieldWhat(
      "Horizontal bands five cells high, each solid on the left and dissolving to the right.",
    ),
    uses: [
      {
        site: "forgeron.sh",
        place: "Pricing, the closing band",
        settings: 'data-shader="dissolve" data-px="8"',
      },
    ],
    versions: [
      {
        title: "Closing band",
        note: "pixel 8",
        demo: { kind: "field", mode: "dissolve", pixel: 8 },
      },
      { title: "Fine", note: "pixel 4", demo: { kind: "field", mode: "dissolve", pixel: 4 } },
      {
        title: "Ink only",
        note: "pixel 8 · accent off",
        demo: { kind: "field", mode: "dissolve", pixel: 8, accent: false },
      },
    ],
    code: fieldCode(
      "dissolve",
      " pixel={8}",
      '<canvas data-shader="dissolve" data-px="8" aria-hidden="true"></canvas>',
    ),
    options: fieldOptions,
  },
  {
    slug: "dithered-image",
    name: "Dithered image",
    summary: "Any picture, redrawn in five greys and the ember.",
    engine: "Canvas 2D",
    home: "@forgeron/blueprint (ditherImage, mountImage); glue in @forgeron/ui (mountDitheredImage, <DitheredImage>)",
    what: [
      "Luminance picks between two neighbouring greys through the 4×4 Bayer threshold.",
      "Warm pixels (red well above green and blue) become ember over the background.",
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
      { title: "Source", note: "the picture, before", demo: { kind: "image", raw: true } },
      { title: "Hero", note: "pixel 3 · gain 1.1", demo: { kind: "image", pixel: 3, gain: 1.1 } },
      { title: "Coarse", note: "pixel 5", demo: { kind: "image", pixel: 5 } },
      {
        title: "Brighter",
        note: "pixel 3 · gain 1.5",
        demo: { kind: "image", pixel: 3, gain: 1.5 },
      },
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
    slug: "hearth",
    name: "Hearth",
    summary: "The wordmark as hot iron on a bed of embers.",
    engine: "Canvas 2D",
    home: "@forgeron/ui (mountHearth, <Hearth>); the original is apps/site/src/illustrations/hearth.ts",
    what: [
      "Cells of five tones by the 8×8 Bayer matrix: iron letters, white hot then ember at their foot.",
      "A dim bed of embers one word high, a few sparks rising; the pointer is the bellows.",
      "Without JavaScript the wordmark stands in cold iron at the same place.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Footer, under the site index",
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
    slug: "reveal",
    name: "Dither reveal",
    summary: "A pixel title resolving out of a dithered glitch.",
    engine: "Canvas 2D",
    home: "@forgeron/ui (mountReveal, <PixelReveal>); the original is apps/font/src/lib/reveal.ts",
    what: [
      "A raster scan: rows start top to bottom, each swept left to right; the front is a slanted edge.",
      "A Bayer threshold switches pixels on around it; near the front they shift and step ember, dark ember, dim, muted, then ink.",
      "About 1.5 s, once. The text is in the page from the start; under reduced motion it simply stays.",
    ],
    uses: [
      {
        site: "font.forgeron.sh",
        place: "Specimen hero, the title “Forgeron Sans”",
        settings: "1500 ms, font pixels at the title's size",
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
    slug: "burn",
    name: "Burn",
    summary: "A front of fire that eats a picture away, or lets it in.",
    engine: "Canvas 2D",
    home: "apps/site/src/pages/index.astro (driven by the scroll); a demo copy in apps/ui-gallery/src/shaders/burn.ts",
    what: [
      "Across the front, a two-ring fringe dithered by the 4×4 Bayer matrix in 4 px cells: outer ring 5 cells of 16 left, inner 11.",
      "Embers along the line, redrawn on a slow tick: white hot, ember and red as it closes; white and greys as it opens.",
      "A clip, not a mask image: the picture is cut in the same frame, on the compositor.",
    ],
    uses: [
      {
        site: "forgeron.sh",
        place: "Home, the opening story: the village appears on load",
        settings: "open · 1.9 s, lobed front",
      },
      {
        site: "forgeron.sh",
        place: "Home, the end of the story: the village burns onto the hero band",
        settings: "close · driven by the scroll",
      },
    ],
    versions: [
      { title: "Close", note: "the end of the story", demo: { kind: "burn", mode: "close" } },
      { title: "Open", note: "the opening reveal", demo: { kind: "burn", mode: "open" } },
    ],
    code: [
      {
        title: "The fringe tile",
        lang: "tsx",
        code: `// A 16 px tile: the cells at or above \`level\` (of 16) painted in the page's background.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function eaten(ctx: CanvasRenderingContext2D, level: number, bg: string) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 16;
  const t = tile.getContext("2d")!;
  t.fillStyle = bg;
  BAYER4.forEach((v, i) => {
    if (v >= level) t.fillRect((i % 4) * 4, Math.floor(i / 4) * 4, 4, 4);
  });
  return ctx.createPattern(tile, "repeat");
}

// Two rings of 16 px inside the front: mostly eaten outside, mostly whole inside.
ctx.fillStyle = eaten(ctx, 5, bg);  // outer ring
ctx.fillStyle = eaten(ctx, 11, bg); // inner ring`,
      },
    ],
    options: [
      {
        name: "mode",
        type: '"close" | "open"',
        description: "A rectangle closing onto a band, or a lobed front opening from the centre.",
      },
      {
        name: "progress",
        type: "number",
        description: "On the site, the scroll (close) or a 1.9 s clock (open); here a loop.",
      },
    ],
  },
];
