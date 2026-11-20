# @forgeron/shaders

Two things in one package: a **fast, flexible rendering system for pixel shaders** (the primitives), and **real, reusable cases built on it** (the examples). The ui gallery's Shaders section shows both: a page per source and pass of the registry, generated from `SOURCES` and `PASSES`, and a page per example, each a built-in preset (`apps/ui-gallery/src/lib/shaders/`). The package is the glue and the orchestrator that keeps it fast: one pipeline of sources and passes compiled to one GL program, one side per page. The pixel effects of the lab language as one pipeline: a **source** (a generator field, the dither field's heat, a picture, a tone function, a constant, the hearth, a moving front) goes through **passes** (`pixelate`, `ordered` Bayer dither, `image-dither`, `glow`, `hatch`, `dissolve`, `ring`, `reveal`, `sparks`, `grid`, `palette`) to an **output** (a WebGL2 canvas, a 2D canvas, RGBA bytes, an SVG path). Each pass is three parts that a page imports separately: its meta (`xMeta`: description and params schema), its GLSL (`xGlsl`) and its CPU function (`xCpu`), with the same result; the sources `heat`, `tone` and `hearth` are CPU only. An effect is a **preset**: JSON, `version: 1`, schema in [`schema/preset.v1.json`](schema/preset.v1.json).

Internal package. Design, phases and the agreement between CPU and GLSL: [`docs/shaders/design.md`](../../docs/shaders/design.md) (D-149). `@forgeron/ui` wraps the mounts in React components (`<FieldShader>`, `<DitherField>`, `<DitheredImage>`, `<Hearth>`, `<PixelReveal>`); `@forgeron/blueprint` re-exports the Bayer matrix, colours, the field GLSL and `ditherImage` from here.

## Mount an effect

```ts
import { mountDitherField, mountField } from "@forgeron/shaders/dom";

mountField(canvas, { mode: "ember", pixel: 8 }); // WebGL2, the site's shader
mountDitherField(hero, { pixel: 4 }); // CPU, 2D canvas
```

## A preset

```ts
import { chainOf, fieldPreset, readPreset, runCpu, toRgba } from "@forgeron/shaders";

const preset = fieldPreset({ mode: "globe", pixel: 4 }); // JSON-ready
readPreset(JSON.parse(text)); // validates and fills defaults, or throws with paths
const rgba = toRgba(runCpu(chainOf(preset), 320, 200, { time: 1.7 })); // static output
```

On the GPU, `createGlPipeline(gl, chainOf(preset))` compiles the chain to one program per stage (cell passes fuse; a `neighbourhood` pass such as `glow` starts a stage that reads the previous one; `present` passes run last, at output resolution) and `render({ width, height, px, time })` draws it. `mountPreset(canvas, preset)` (`/dom`) runs any preset on the GPU when every step has GLSL, on the CPU otherwise.

## One side per page

`chainOf` binds a preset to every definition (the registry, `PASSES` and `SOURCES`): for tools, tests and the gallery. A live mount binds its preset to the one side it runs, from a small table keyed by type, so the page bundles neither the other side nor the params schemas:

```ts
import {
  bindChain,
  fieldPreset,
  fieldGlsl,
  gridGlsl,
  orderedGlsl,
  paletteGlsl,
  pixelateStep,
} from "@forgeron/shaders";
import { glPipeline } from "@forgeron/shaders/dom";

const chain = bindChain(
  fieldPreset({ mode: "globe" }),
  { field: fieldGlsl },
  { pixelate: pixelateStep, ordered: orderedGlsl, grid: gridGlsl, palette: paletteGlsl },
);
glPipeline(gl, chain); // one stage, no framebuffer or texture code bundled
```

## Checks

- `bunx vitest run packages/shaders`: the effects equal the code they replaced (dither field, `ditherImage`, `ditherPath`, Bayer tables), presets validate, the schema is up to date (`bun scripts/shaders/gen-schema.ts`).
- `bun scripts/shaders/check-agreement.ts` (moon `shaders:agreement`): CPU against GLSL in headless Chrome, exact for the integer and ordered passes (`ordered`, `glow`, `hatch`, `dissolve` held, `palette`, `grid`), within a stated share for the float ones (`image-dither`, the fields).
