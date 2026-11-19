# @forgeron/shaders

The pixel effects of the lab language as one pipeline: a **source** (a generator field, the dither field's heat, a picture, a tone function, the hearth) goes through **passes** (`pixelate`, `ordered` Bayer dither, `image-dither`, `grid`, `palette`) to an **output** (a WebGL2 canvas, a 2D canvas, RGBA bytes, an SVG path). Each pass is a params schema, a GLSL chunk and a CPU function with the same result. An effect is a **preset**: JSON, `version: 1`, schema in [`schema/preset.v1.json`](schema/preset.v1.json).

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

On the GPU, `createGlPipeline(gl, chainOf(preset))` compiles the chain to one program per stage (cell passes fuse; `present` passes run last, at output resolution) and `render({ width, height, px, time })` draws it.

## Checks

- `bunx vitest run packages/shaders`: the effects equal the code they replaced (dither field, `ditherImage`, `ditherPath`, Bayer tables), presets validate, the schema is up to date (`bun scripts/shaders/gen-schema.ts`).
- `bun scripts/shaders/check-agreement.ts` (moon `shaders:agreement`): CPU against GLSL in headless Chrome, exact for the integer and ordered passes, within a stated share for the float ones.
