# Shaders: one pipeline of passes, with presets

> Status: S1 built (19 November 2026): the package, its pass contract and presets, and the migration of today's effects with no visible change (S1 notes at the end). S2 built the same day: one side per module, the neighbourhood stages and seven new passes (S2 notes at the end); S2c the same day: GLSL compiled ahead of time, fused CPU loops and lazy mounts for page weight (S2c notes at the end); S3 and S4 to come. Applies D-149 and the handoff's "`@forgeron/shaders` (approved direction)" ([`../handoff/2026-11-18-ui-canvas-blueprint.md`](../handoff/2026-11-18-ui-canvas-blueprint.md)). Blueprint ([`../blueprint/engine.md`](../blueprint/engine.md), D-150) is its first client.

`@forgeron/shaders` gathers the pixel effects of the lab language. An effect is a **source** (a field, a picture, a scene buffer, text) that goes through a chain of **passes** (pixelate, ordered dither, palette, grid…) to an **output** (a live canvas, or a static PNG or SVG at build time). Each pass is written twice, in GLSL and on the CPU, with the same result. The settings of an effect are a **preset**: versioned JSON, shared by the site, code and, later, the pass editor.

**Fixed by the owner** (not reopened here): GLSL passes run on one WebGL2 context; a CPU pass moves to Rust (`crates/fg-shaders`) only when a measurement says so; `@forgeron/ui` keeps thin React wrappers; `shaders.forgeron.sh` takes over the gallery's Shaders section; Blueprint's pixels do not change.

## 1. What exists today (4f0579f6)

### Effects

| Effect                                          | Where                                                                                                                                                                | API                                                                                     | Engine                                                                 | Used by                                                                                                           | Cost (M4, one frame)                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Ordered dither (Bayer 2, 4, 8)                  | `blueprint/src/core/bayer.ts`                                                                                                                                        | `bayer(x, y, n)`, `matrix(n)`                                                           | —                                                                      | every effect below; `ditherPath`, site `explorations/lab/pixel.ts`                                                | —                                                 |
| Generator fields: ember, globe, dissolve, field | GLSL in `blueprint/src/core/field.ts` (`FIELD_FRAGMENT`); glue twice: `blueprint/src/dom/field.ts` (`mountField`) and `ui/src/shaders/field.ts` (`mountFieldShader`) | `mountField(canvas, {mode, pixel, accent, colors})`; `<FieldShader>`                    | WebGL 1, one fragment shader, Bayer 8 threshold, three tones, grid gap | site home (`saga-bg` field, `cta-glow` ember), explorations, gallery `/shaders/{ember,field,globe,dissolve,burn}` | GPU; 17 ms on the CPU for one hero (core comment) |
| Dither field (the sub-sites' hero)              | `ui/src/shaders/dither-field.ts`; **three copies** `apps/{font,icon-gallery,ui-gallery}/src/lib/dither-field.ts` + `pixels.ts`                                       | `mountDitherField(canvas, {pixel, tones, fps})`; `<DitherField>`; `canvas[data-dither]` | CPU, 2D canvas, one canvas pixel per cell                              | font home (px 5), icon-gallery home (px 4), ui-gallery home (px 4), gallery `/shaders/dither-field`               | 0.68 ms for 360×150 cells                         |
| Dithered image                                  | `blueprint/src/core/image.ts` (`ditherImage`); glue twice: `blueprint/src/dom/image.ts` (`mountImage`), `ui/src/shaders/image.ts` (`mountDitheredImage`)             | `canvas[data-dither-img]`; `mountDitheredImage`                                         | CPU, 2D canvas, Bayer 4, five greys + ember                            | site explorations (`landing-d`), gallery `/shaders/dithered-image`                                                | 0.13 ms for 160×100                               |
| Hearth                                          | `ui/src/shaders/hearth.ts`; copy `apps/site/src/illustrations/hearth.ts`                                                                                             | `mountHearth(root, {text, cell})`; `<Hearth>`                                           | CPU generator, five tones, 2D canvas upscaled with a grid gap          | site footer (every page), gallery `/shaders/hearth`                                                               | 1.54 ms for 320×70                                |
| Reveal                                          | `ui/src/shaders/reveal.ts`; a variant in `apps/font/src/lib/reveal.ts`                                                                                               | `mountReveal`, `<PixelReveal>`                                                          | CPU, cells as `fillRect`                                               | font hero (its own copy), gallery `/shaders/reveal`                                                               | small (a title's pixels)                          |
| `ditherPath`                                    | `ui/src/shaders/dither-svg.ts`                                                                                                                                       | `ditherPath(cols, rows, tone, n)`                                                       | static SVG at build                                                    | gallery `/shaders/ordered-dither`                                                                                 | 0.02 ms for 64×16                                 |
| Burn and caption corruption                     | inline in `apps/site/src/pages/index.astro`; a looping copy `apps/ui-gallery/src/shaders/burn.ts`                                                                    | page scripts                                                                            | CPU, 2D canvas, Bayer 4 tile patterns                                  | site home story, gallery `/shaders/burn`                                                                          | —                                                 |
| Blueprint filters                               | `blueprint/src/core/filters.ts` (`pixelate`, `dither`, `glow`, `palette`, `grid`), applied by the Rust raster                                                        | data in `.bp` files                                                                     | CPU in Rust; presenters `present-2d.ts`, `present-webgl2.ts`           | every iso scene                                                                                                   | see `engine.md`                                   |

### What is duplicated

- The canvas glue (context, compile, observers, loop, reduced motion, token reading): `blueprint/dom/{field,image}.ts` and `ui/shaders/{field,image,surface}.ts`.
- The dither field and its Bayer table: three app copies plus ui's.
- The hearth: the site's and ui's (the frame function is identical).
- A Bayer 4 table as a literal array: site home, gallery burn.

## 2. The pass contract

A **pass** is three things with one meaning:

```ts
interface PassDef<P> {
  type: string; // "ordered", "palette"…
  kind: "cell" | "present"; // per cell, or per output pixel (last stage only)
  params: ParamsSchema; // names, types, ranges, defaults: validates presets, drives the editor
  glsl(p: P): GlslChunk; // { decl, body }: `body` maps `vec4 c` at `vec2 cell`, params as literals
  cpu(frame: Frame, p: P, ctx: CpuContext): void; // the same map over a CPU frame
}
```

- **Frame** (CPU): `width × height` cells, four `Float64` channels per cell, row 0 at the top. A source writes it; each pass rewrites it; an output reads it. Channels carry a value (`r`), a tone index (`r`, an integer), or a colour (`rgb` in 0..1, `a`).
- **Same result**: an integer or ordered pass (thresholds, palette lookup, grid) gives the same bytes on the GPU and the CPU; a float pass (a generator's noise, a luminance) agrees within a stated tolerance (§6). Params are baked into the GLSL as literals, written in the same form as the original expressions, so a preset compiles to the shader the site ran.
- **Sources** have the same shape (`params`, `glsl` returning `vec4 source(vec2 cell)`, `cpu` filling a frame). A source can be GPU-native (the generator fields: their CPU version is a port, close but not equal) or CPU-native (the dither field, the hearth, the reveal: they have no GLSL in S1 and run on the CPU only).
- **Inputs**: every stage sees `uRes` (output size in device pixels), `uPx` (device pixels per cell), `uCells` (columns, rows), `uTime`, `uMouse`; the CPU context has the same.
- **Coordinates**: `cell` is the GPU's (`floor(gl_FragCoord.xy / uPx)`, row 0 at the bottom). A pass that needs rows from the top says so (`origin: "top"`), and the CPU flips. The CPU frame assumes whole cells; the GPU keeps a partial cell on the top and right edges.

### Sources and outputs

| Source                                  | S1                                          | GLSL                        | CPU                              |
| --------------------------------------- | ------------------------------------------- | --------------------------- | -------------------------------- |
| `field` (ember, globe, dissolve, field) | yes                                         | the site's shader, verbatim | a float64 port (tolerance, §6)   |
| `heat` (the dither field's level)       | yes                                         | —                           | exact, the function the apps ran |
| `image` (RGBA pixels)                   | yes                                         | sampled texture             | the pixels                       |
| `tone` (a function of `(x, y)`)         | yes, CPU only                               | —                           | the function                     |
| `hearth`, `reveal`                      | yes, CPU generators that write tone indices | —                           | exact                            |
| `scene` (a Blueprint slot buffer)       | S2                                          | `usampler2D`                | the buffer                       |
| `text` (the pixel face)                 | S2                                          | —                           | rows of the face                 |

| Output             | Where                                                          |
| ------------------ | -------------------------------------------------------------- |
| live WebGL2 canvas | `runGl` / `mountGl` (`@forgeron/shaders/dom`)                  |
| 2D canvas          | `runCpu` + `putImageData`, optionally upscaled with a grid gap |
| static PNG         | `runCpu` → RGBA bytes (a PNG encoder at build is S4's)         |
| static SVG         | `toSvgPath(frame)`: one `M x y h1v1h-1z` per drawn cell        |

### Pipeline

- **Chains and presets**: a `Chain` is a preset in memory, holding the definitions themselves (`bindSource`, `bindPass`), so a mount bundles only the passes it runs; `toPreset(chain)` writes the JSON and `chainOf(json)` reads it back (validated by the registry, `PASSES` and `SOURCES`).
- **CPU chain** (`runCpu(chain, width, height, inputs)`): source fills the frame, passes run in order, `toRgba` writes bytes.
- **GLSL chain** (`createGlPipeline(gl, chain)`): the chain is cut into **stages**. Consecutive `cell` passes fuse into the stage before them (one program, no texture between them). A pass marked `neighbourhood` (S2: glow, edges, CRT) starts a new stage that reads the previous one through `texelFetch` on a ping-pong pair of `RGBA32F` framebuffers at cell resolution (`EXT_color_buffer_float`). `present` passes (grid gap) run in the last stage, at output resolution. All stages share one WebGL2 context and one full-screen triangle. Every current effect is one stage, so it compiles to a single program.
- `pixelate` is hoisted: it sets the cell size (as Blueprint's `plan` does), it never resamples.

## 3. Presets

A preset is JSON, `version: 1`, schema `packages/shaders/schema/preset.v1.json` (`$id` `https://shaders.forgeron.sh/schema/preset.v1.json`), generated from the pass params and checked by a test.

```json
{
  "$schema": "https://shaders.forgeron.sh/schema/preset.v1.json",
  "version": 1,
  "name": "field-ember",
  "source": { "type": "field", "mode": "ember" },
  "passes": [
    { "type": "pixelate", "size": 4 },
    {
      "type": "ordered",
      "matrix": 8,
      "centered": false,
      "origin": "bottom",
      "steps": [
        [0, 1],
        [0.86, 0.12]
      ]
    },
    {
      "type": "palette",
      "tones": [
        { "var": "--bg", "fallback": "#0a0a0a" },
        { "var": "--ink", "fallback": "#ededed" },
        { "var": "--accent", "fallback": "#ff4f1f" }
      ]
    },
    { "type": "grid", "gap": 0.16, "min": 4 }
  ]
}
```

- `validatePreset(json)` returns the preset or a list of errors with JSON paths; unknown keys and passes are errors; defaults fill what is missing.
- A colour is a literal CSS colour, a token (`"--accent"`, its fallback black) or `{ var, fallback }` (Blueprint's `ColorRef`).
- Built-in presets (`builtInPresets()`, a function so that a page does not bundle every effect): `field-ember`, `field-globe`, `field-dissolve`, `field-field`, `dither-field`, `dithered-image`, `hearth`. The mounts build their chain from their options (`fieldChain(options)`, `fieldPreset(options)` for the JSON…), so a component is a preset with defaults.
- `ordered` steps: `[offset, scale]` pairs; tone `k` is the number of consecutive steps from the first whose `value > offset + threshold × scale`. The site's field is `[[0, 1], [0.86, 0.12]]`, the dither field `[[0, 0.9], [0.45, 1]]`.

## 4. Packages

```text
@forgeron/shaders          neutral core: Bayer, colours, the pass contract, passes, sources,
                           CPU pipeline, GLSL generation, presets and their schema
@forgeron/shaders/dom      browser: WebGL2 helpers and pipeline, canvas glue (observers, loop,
                           reduced motion, tokens), mounts: field, dither field, image, hearth, reveal
@forgeron/ui               React wrappers (<FieldShader>, <DitherField>, <DitheredImage>, <Hearth>,
                           <PixelReveal>) and shaders.css; re-exports the functions it exported before
@forgeron/blueprint        re-exports bayer, parseColor, the field GLSL, ditherImage from shaders;
                           dom/field.ts and dom/image.ts are thin wrappers; present-webgl2 uses
                           the GL helpers
```

- Rules (`.dependency-cruiser.cjs`): `shaders-is-below-ui-and-blueprint` (shaders imports neither ui nor blueprint nor canvas), `shaders-core-is-framework-free` (`src/core` imports no DOM layer and no React), `shaders-core-stays-neutral` (no `node:*`). ui and blueprint may import it; moon's graph stays acyclic (`ui → blueprint → shaders`, `ui → shaders`).
- **ui** keeps what is React (components, CSS). Its exports do not change: `mountDitherField`, `ditherFieldFrame`, `hearthFrame`, `revealFrame`… are re-exported from the package.
- **Blueprint** is the first client and stays in charge of its own pixels: its shading, dither and glow run in Rust on the slot buffer (D-150), and its `Filter` chain keeps its meaning. Its vocabulary is the package's (`pixelate`, `dither` = `ordered` with Bayer 4 centred, `palette`, `grid`; `glow` is Blueprint's own until S2 adds a general one). The WebGL2 presenter takes the package's program helper only; its shader is unchanged and its `readPixels` still equals the 2D presenter byte for byte. Later (S2), a scene preset may add post passes after the presenter (`scene` source → passes), never inside the raster.

## 5. Phases

### S1: design, core, migration with no visible change (this one)

The package, the contract, the CPU and GLSL pipelines, presets and schema, the passes today's effects are made of (`pixelate`, `ordered`, `palette`, `grid`, `image-dither`) and their sources (`field`, `heat`, `image`, `tone`, `hearth`, `reveal`). ui, Blueprint's glue, the apps' dither fields and the site's hearth move onto it. Gate: every migrated canvas identical before and after in headless Chromium under a frozen clock, no console error; CPU and GLSL agree pass by pass.

### S2: new passes

Blue noise (a 64×64 tileable mask, ordered like Bayer), Floyd–Steinberg (CPU only: error diffusion is serial; on the GPU an approximation is not offered), halftone (dots on a rotated grid), scanlines, edges (Sobel on the value), CRT (barrel, mask, bloom), glow (separable, on the accent tones). The `neighbourhood` stages, the `scene` and `text` sources, and the burn and caption corruption of the site's home as presets. Each pass lands with its agreement test.

### S3: Rust CPU passes, when measured

`crates/fg-shaders` for the passes whose CPU cost is measured as too high (Floyd–Steinberg on a full hero, palette quantisation of large images, the build-time PNG and SVG of every preset), behind the same `cpu` signature; WASM shared with `fg-blueprint` or its own small module. Parity: the Rust pass equals the TypeScript one byte for byte under Node, as Blueprint's raster did.

### S4: `shaders.forgeron.sh` and the pass editor

`apps/shaders`: the gallery of presets (taking over the gallery's Shaders section, which keeps a summary and a link), and the editor: a stack of passes with live params from the schema, a source picker, export of the preset JSON and of the code that mounts it, static PNG/SVG export.

## 6. Agreement between CPU and GLSL

Checked in headless Chromium (`bun scripts/shaders/check-agreement.ts`, moon `shaders:agreement`), each pass alone on a fixed input, then each built-in chain:

- `ordered`, `palette`, `grid`, `pixelate`: **exact** (byte equality), inputs on a grid of levels and thresholds, cells of 4 and 6 pixels;
- `image-dither`: GLSL luminance in float32 against the CPU's float64: tolerance stated in the S1 notes (cells whose tone differs);
- `field` source: the CPU port runs in float64, the GPU in float32 with its own `sin`; the hash noise amplifies the difference, so agreement is a share of cells with the same tone, stated per mode in the S1 notes. The live site always runs the GLSL; the CPU port is for static outputs, where it is the picture by definition.

## 7. Risks

- **A visible change by accident.** Mitigation: parity of every migrated canvas before and after under a frozen clock; GLSL emitted with the original expressions as literals.
- **WebGL 1 to WebGL2 for the fields.** The field programs move to a WebGL2 context. Same float precision (`highp`); the harness compares them.
- **Contexts per page.** Browsers keep about 16 live WebGL contexts; the gallery's shader pages use one per field demo, as before. A page with many fields could share one context later (S4's editor).
- **Float passes on the CPU.** A float port is never bit-equal to a GPU; static outputs are defined by the CPU, live ones by the GPU.
- **Weight.** The ui bundle carries the GL pipeline only when a field is mounted; the validator and the schema are not imported by the mounts. Since S2c the live mounts of fixed shape ship their GLSL as text and their CPU chain as one loop, and import no module that holds the generators (S2c notes).

## S1 notes

Built 19 November 2026 on `chore/site-forgeron-sh` from `4f0579f6`.

1. **The package.** `packages/shaders`: core (`src/core/`: Bayer, colours, params schemas, the contract, five passes, six sources, CPU runner, GLSL stages, presets and their schema) and `dom` (`src/dom/`: WebGL2 helpers, the GPU pipeline with ping-pong `RGBA32F` framebuffers, the canvas glue, the mounts). Rules `shaders-is-a-leaf`, `shaders-core-is-framework-free`, `shaders-core-stays-neutral`, with self-test cases; the core is a neutral entry of `scripts/check-neutral.ts`.
2. **What moved.** ui's `src/shaders/{surface,field,dither-field,image,hearth,reveal,dither-svg}.ts` moved into the package; ui keeps `react.tsx` (same props), `shaders.css`, `textRows` and its names over the package (`mountFieldShader`, `mountHearth` and `hearthGrid` in Blueprint's pixel face), and re-exports everything it exported before. Blueprint's `core/{bayer,field,image}.ts` and `parseColor`, `cssColor`, `RGB`, `ColorRef` are re-exports; `dom/field.ts` and `dom/image.ts` are wrappers of `mountField` and `mountDitheredImage`; `dom/colors.ts` is gone. The three apps' dither fields (`apps/{font,icon-gallery,ui-gallery}/src/lib/dither-field.ts`) call `mountDitherField`; their `pixels.ts` copies are gone (the font's reveal takes `bayer`). The site's footer mounts the package's hearth; `apps/site/src/illustrations/hearth.ts` is gone and its test moved to ui (`hearth.test.ts`).
3. **The fields move to WebGL2.** `mountField` compiles `fieldChain` (source `field`, `pixelate`, `ordered` 8 plain from the bottom with steps `[0, 1]`, `[0.86, 0.12]`, `grid` 0.16 from 4 px, `palette`) to one GLSL ES 3.00 program whose value code is the site's shader line for line, with the thresholds written as it wrote them. In headless Chromium (SwiftShader) it draws the same pixels as the WebGL 1 shader. A browser with WebGL 1 only now leaves the field blank, as one without WebGL did before.
4. **Blueprint's presenter** takes `linkProgram` from the package; its shader is unchanged and `scripts/blueprint/check-presenters.ts` still finds `readPixels` equal to the 2D presenter for the ten scenes. Blueprint's raster, dither and glow stay in Rust; its golden suites pass (234 tests).
5. **Parity.** A harness (headless Chromium over CDP, 1280×2400 at DPR 1; `performance.now` and `requestAnimationFrame` driven by hand: 2 s of frames at `t = 0`, then the clock moved 1.7 s and six frames; WebGL contexts forced to `preserveDrawingBuffer`; every canvas copied to a 2D canvas and hashed) ran on the four apps built at `4f0579f6` and after: the site's home, `/pricing`, `/machine`, `/wild-erp`; the font and icon-gallery homes; the gallery's home, `/shaders` and its ten pages. 67 canvases identical out of 67 (fields, dither fields, hearths, images, reveals, burns), 0 console errors before and after; the 34 iso canvases of the site, played in a worker whose clock the harness does not drive, differ between two runs of the same build and are left out. The baseline was run twice: identical.
6. **CPU against GLSL** (`scripts/shaders/check-agreement.ts`, 50 cases): `ordered` (matrices 2, 4, 8; centred or not; from the top or the bottom; three sets of steps), `palette`, `grid` at 4 and 6 px, and the same chain cut into a stage per pass (framebuffers): exact, 0 pixels differ. `image-dither`: 0 pixels differ (tolerance 0.1 %). The `field` source: 3.4 to 8.5 % of pixels differ (ember 4.0–4.2, globe 4.3–4.5, dissolve 7.8–8.5, field 3.4–3.5; tolerance 10 %): float32 against float64 through a hash that multiplies `sin` of arguments in the thousands by 43758. Rounding the CPU's arguments to float32 made it worse. The live pages always run the GLSL.
7. **Weight** (page JS, gzip, static imports and islands): site home 18.9 → 23.7 KB, `/pricing` 15.6 → 20.4, font home 4.3 → 6.5, icon-gallery home 73.7 → 76.8, gallery pages 465.5 → 470.3, `/editors/blueprint` 503.7 → 508.7. A mount now carries its passes' params schemas and both versions of each pass (the field mount the CPU port, the CPU mounts the GLSL generators) and the generic pipeline (stages, framebuffers): `mountField` alone is 6.5 KB gzip against 2.4 before, `mountDitherField` 3.2 against about 1.1 for an app's copy. The first fix measured: `builtInPresets()` as a function instead of a constant (the constant made every page bundle every effect, +5.6 KB).
8. **Not migrated.** The burn and the captions' corruption of the site's home (inline in `apps/site/src/pages/index.astro`, Bayer 4 tiles as `CanvasPattern`s) and the gallery's copy (`apps/ui-gallery/src/shaders/burn.ts`): a 2D-canvas effect driven by the scroll and the hero's clip, not a chain of cells; S2 brings them as presets. The font's own reveal (`apps/font/src/lib/reveal.ts`, two lines, its own timing) is not the package's `mountReveal`; it only takes `bayer` from the package. The hearth and the reveal stay CPU generators with their own presenters (upscale and gap, `fillRect`), not the `grid` pass: their gap rule (`max(1, round(cell × 0.16))`) differs from the field's.
9. **Next.** Split each pass into its meta, GLSL and CPU parts so that a live mount bundles one side (the weight above); S2's passes and the `neighbourhood` stage kind; the burn as presets; the gallery's Shaders section reading `builtInPresets()`.

## S2 notes

Built 19 November 2026 on `chore/site-forgeron-sh` from `51529742`. Measured with the S1 harness (headless Chromium, frozen clock, 1280×2400 at DPR 1) and its weight script (page JS, gzip 9, static imports and islands).

1. **One side per module (S2a).** A pass or a source is now three parts: its meta (`xMeta`: type, kind, description, params schema; `passes/x.ts`, with its params type and the helpers both sides share), its GLSL (`xGlsl`, `passes/x.glsl.ts`) and its CPU function (`xCpu`, `passes/x.cpu.ts`). The contract types follow (`PassHead`, `GlslPass`, `CpuPass`, `PassMeta`; `PassDef` is the three together). Separate modules, not only separate exports: Rollup chunks by module, so with two islands that need different sides of one module (the gallery) a shared chunk would carry both.
2. **Presets are data, chains bind a side.** `fieldPreset`, `ditherFieldPreset`, `ditheredImagePreset`, `hearthPreset` build JSON directly (no definition attached); `bindChain(preset, sources, passes)` binds one to the definitions a mount passes, keyed by type (`{ field: fieldGlsl }`, `{ ordered: orderedGlsl, … }`); `chainOf(json)` still validates and binds every definition (the registry, `preset.ts`, which no live mount imports). `GlChain` and `CpuChain` type each side. The `*Chain` builders are gone (only the package used them). `builtInPresets()` and `passPresets()` live in `built-in.ts`, the masks in `masks.ts`, so a mount importing `presets.ts` does not bundle the S2 presets. `$schema` is added by `builtInPresets()` only.
3. **The GPU pipeline takes its extensions.** `glPipeline(gl, chain, options, ext)` compiles and draws; the float framebuffers between stages (`floatTargets`) and the textures (`textureStore`: the image source, float tables) are extensions in `pipeline-gl-ext.ts`, and `createGlPipeline` (any chain) passes both. The field mount uses `glPipeline` without them (one stage, no texture). On the CPU, the upscale to output resolution moved out of `runCpu` into `perPixel`, called by the `present` passes (`grid`, `crt`), and a CPU pass may return the frame that replaces its input.
4. **Weight**, page JS in KB gzip, before S1 (`4f0579f6`) → S1 (`51529742`) → S2a alone → S2 (S2a and S2b):

   | Page                 | Before S1 | S1    | S2a   | S2    |
   | -------------------- | --------- | ----- | ----- | ----- |
   | site `/`             | 18.9      | 23.7  | 22.1  | 22.0  |
   | site `/pricing`      | 15.6      | 20.4  | 18.8  | 18.8  |
   | font `/`             | 4.3       | 6.5   | 5.7   | 5.7   |
   | icon-gallery `/`     | 73.7      | 76.8  | 76.0  | 76.0  |
   | ui-gallery pages     | 465.5     | 470.3 | 468.9 | 470.4 |
   | `/editors/blueprint` | 503.7     | 508.7 | 507.3 | 509.1 |

   The target (each page at or below its weight before S1) is **not met**: S2a won back 0.8 to 1.6 KB per page of the 2.2 to 4.8 S1 added. What is left is the generic machinery itself, measured through source maps on the site's home: the GPU side carries `glPipeline` (0.8 KB alone), `compileStages` (0.7) and the GLSL generators of `ordered`, `grid` and `palette` where the site carried one literal shader; the CPU side carries `runCpu`, frames of four float64 channels, the palette's CPU side and `bindChain` where the hearth and the dither field were fused loops (the font's dither field: 2.5 KB against 1.2). The gallery's pages gained 1.5 KB back in S2b with no new code on them: the preset island (`PresetDemo`) shares modules with ui's bundle, so Rollup cut those into shared chunks (6 files a page → 9) and gzip pays per file. Two levers remain, not taken here: GLSL compiled at build time (a mount ships its stage's text and its binds, not the generators: about −0.7 KB on a field page), and the site's below-the-fold mounts (footer hearth, `saga-bg`, `cta-glow`) loaded when they near the viewport, as the iso engine is (the whole shaders cost leaves the home's start; it changes what the harness captures off screen, so it needs the owner's word).

5. **Parity (S2a and S2).** The S1 harness on the same 18 pages: 67 of 67 canvases identical to `51529742`, 0 console errors. One full run in two (S2a and S2) left the site's home or `/pricing` unmounted at capture (canvases at 300×150, no error) and the home's `saga-burn` canvas unsized; reruns of those pages are identical, and the baseline's pages behave the same way under load (the reveal's timing against the harness's ticks).
6. **Neighbourhood stages.** `PassKind` gains `neighbourhood`: such a pass starts a stage that reads the previous one through `prevAt(cell)` (a `texelFetch` clamped to the frame, as `valueAt` on the CPU), on the ping-pong `RGBA32F` framebuffers. A pass may return several chunks (each after the first starts a stage: the separable glow), and a `present` pass may set `cut` (it samples the previous stage: the CRT). Nothing cuts after a present pass. A pass whose `glsl` is null runs on the CPU only (`compileStages` says so). A pass that reads cells cannot follow a present one (the validator names it).
7. **New passes (S2b)**, each with GLSL and CPU (Floyd–Steinberg CPU only), in the registry and the schema, and checked by `scripts/shaders/check-agreement.ts` (73 cases, all agree):

   | Pass              | Kind                      | CPU against GLSL                                                                                                                                                                      |
   | ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `blue-noise`      | cell                      | exact (0 px): a 64×64 void-and-cluster mask (σ 1.5, fixed seed, about 40 ms once), thresholds `(rank + 0.5) / 4096` in an `R32F` texture; the CPU compares in float32 (`Math.fround`) |
   | `floyd-steinberg` | neighbourhood, CPU only   | no GPU version (error diffusion is serial; blue noise is the GPU's answer); vitest: the textbook checkerboard and the mean kept                                                       |
   | `halftone`        | cell                      | tolerance 0.5 % (measured 0): cosine, sine and pitch written once as literals                                                                                                         |
   | `scanlines`       | cell                      | tolerance 2 %: 0 on palette colours, 1.3 % on raw picture colours (bytes on a rounding tie: the GPU's unorm conversion against `Math.round`)                                          |
   | `edges`           | neighbourhood             | tolerance 1 % (measured 0): Sobel on the value                                                                                                                                        |
   | `glow`            | neighbourhood, two stages | exact (0 px): binomial kernel, whole sums over a power of two, dithered by Bayer; tone indices before the palette, as Blueprint's glow                                                |
   | `crt`             | present that cuts         | tolerance 2 % (measured 0.007 %): barrel, aperture mask, bloom, vignette at output resolution                                                                                         |

   And a `constant` source (one value everywhere). The bug the check found on the way: making a texture bound it to the unit active at the time (the image's), so the pipeline now activates a unit before it makes or binds a texture.

8. **The burn and the captions.** What became a preset, with parity: the corruption's masks. `bayerMaskPreset(level)` is a constant level through the 4×4 ordered dither; `bayerMaskPath(level, { cell: 4 })` writes the cells on (the captions' 17 masks) and `{ off: true }` the cells eaten (the burn's fringe at levels 5 and 11). The site's home writes them at build time into `data-masks` and `data-fringe` (the page no longer carries the Bayer table) and the gallery's burn demo receives them from its page; a test checks the 17 masks and the two fringes path for path against the strings the page built. What stays page code, and why: the fronts are vector geometry driven by the scroll and a clock (a rectangle lerped on the scroll, a 144-side lobed polygon whose edges the canvas antialiases, with the site's lobe phases drawn by `Math.random` on each load), and the embers are scattered `Path2D` rects along moving edges, overlapping in draw order, picked by an integer hash of time; neither is a function of a cell, so a chain of cell passes cannot draw them with pixel parity. The captions' jolt and dimming are DOM transforms and a class, not pixels.
9. **The gallery.** Each S2 pass has a page (`/shaders/blue-noise`, `floyd-steinberg`, `halftone`, `scanlines`, `edges`, `glow`, `crt`), generated from `builtInPresets()` and the pass's params schema: the live demo (`PresetDemo`, `mountPreset` of `@forgeron/shaders/dom`: GPU when every step has GLSL, CPU otherwise) draws a control per setting, the options table is the schema, the snippets are the preset's JSON and the code that mounts it. The cards of the Shaders grid draw a preset as a static SVG at build time (`presetSvg`: the chain up to its palette on the CPU, one path per tone), so the grid ships no JavaScript for them. The ten S1 pages are unchanged.
10. **Not done.** The `scene` and `text` sources (Blueprint's slot buffer, the pixel face); S3's Rust passes (none measured as needed yet: Floyd–Steinberg on the heat costs 3.1 ms a frame for 320×200 cells in Bun, against 2.1 for the ordered dither; the blue noise mask about 40 ms once); the build-time GLSL and the lazy mounts of point 4; real GPUs and browsers other than headless Chromium's SwiftShader.

## S2c notes

Built 19 November 2026 on `chore/site-forgeron-sh` from `98d358e1`, to bring each page back to its JS weight before S1 with no visible change, through the two levers of S2 note 4 (approved by the owner). Measured as in S2: page JS in KB gzip 9 (static imports and islands); what a page loads later is counted apart.

1. **GLSL compiled ahead of time.** `bakeProgram(chain)` (`core/bake.ts`) compiles a chain of one stage and records the uniforms its chunks bind; `bun scripts/shaders/bake.ts` writes `core/field.baked.ts` from `bakeField()`: the field's fragment shader with the ember and without (`accent: false`), and the names of its two uniforms (`uMode`, `p3_tones`). The text depends on the accent only (modes, tones and cell size are uniforms; a test checks it for every mode, and fails when the written file is stale). `mountField` links that text and sets the uniforms as `glPipeline` did, so it no longer bundles `compileStages`, the generators of `ordered`, `grid` and `palette`, `bindChain` or the presets. `mountPreset` (the gallery's live demos, any chain) still compiles at run time. Chosen over a Vite plugin or a `?shader` import: the field is the only live GPU mount, its text has two variants, and a generated module needs no change in the four apps' configs nor in ui's and Blueprint's wrappers.
2. **Fused CPU loops** (`core/fused.ts`): `ditherFieldPixels` (heat, ordered 8 centred from the top, palette) and `hearthPixels` (the hearth's tones through its palette, tone 0 transparent) write the bytes `runCpu` then `toRgba` wrote, without frames of four float64 channels or pass definitions. Exact: a channel goes through `c / 255` and back by `Math.round(x × 255)`, which gives every whole channel back (colours from `resolveColor` are whole), and a test compares both paths byte for byte on four sizes and times each (colours beyond 255 included). The dither field reads its tones on each resize instead of through `colorCache` (the same reads: the cache was reset there).
3. **No generator module on a live mount's path.** Rolldown places a module by the entries that reach it and keeps in it every export any entry uses: a live mount importing one constant from a module that also holds what the gallery's `PresetDemo` uses shipped that code to every page. So `GL_VERTEX` moved to `core/vertex.ts` (out of `glsl.ts`), `BAYER_GLSL` to `core/bayer.glsl.ts`, `heatLevel` to `sources/heat.ts` (the helpers both sides share), and the dither field's tones, fallbacks and steps to `core/dither-field.ts` (out of `presets.ts`, which imports the CPU runner and half the passes). The public exports are unchanged.
4. **Lazy mounts on the site.** `whenNear(el, fn)` (`apps/site/src/illustrations/near.ts`): `fn` runs once when `el` comes within a screen's height of the viewport (IntersectionObserver, `rootMargin: "100% 0px"`, as the iso engine starts), at once without IntersectionObserver. `canvas.ts` loads `effects.ts` (the field and dithered-picture mounts) that way for each `canvas[data-shader]` and `canvas[data-dither-img]`; the footer loads `footer-hearth.ts` (the hearth and Blueprint's pixel face) the same way. A canvas marked `data-eager` is left to its page: the home's `saga-bg` is in the hero (S2 counted it below the fold; it is above), so the home mounts it at once from its own script and its code stays in the start. `cta-glow`, the footer's hearth and `/pricing`'s globe and dissolve are lazy.
5. **The gallery.** Its hero dither field (on the home only) was imported by the layout of every page and from `@forgeron/shaders/dom`, which split the mount into a chunk shared with ui's bundle on every page; it is now the home's own script, taken through `@forgeron/ui` (whose chunk the home's islands load anyway).
6. **Weight**, KB gzip, before S1 (`4f0579f6`) → `98d358e1` → lever 1 (notes 1 and 2) → note 3 → lever 2 and notes 4 and 5 (with, in brackets, what loads when the effects come near the screen):

   | Page                                | Before S1 | `98d358e1` | Lever 1 | Note 3 | Now         |
   | ----------------------------------- | --------- | ---------- | ------- | ------ | ----------- |
   | site `/`                            | 18.9      | 22.0       | 19.8    | 19.8   | 17.3 (+3.7) |
   | site `/pricing`                     | 15.6      | 18.8       | 16.6    | 16.6   | 10.0 (+7.8) |
   | font `/`                            | 4.3       | 5.7        | 5.0     | 5.0    | 4.9         |
   | icon-gallery `/`                    | 73.7      | 76.0       | 73.7    | 73.7   | 73.7        |
   | ui-gallery `/`                      | 465.5     | 470.4      | 469.1   | 468.2  | 467.5       |
   | ui-gallery `/shaders`, its S1 pages | 465.5     | 470.4      | 469.1   | 468.2  | 467.3       |
   | `/editors/blueprint`                | 503.7     | 509.1      | 507.8   | 506.3  | 505.4       |

   Met for the site's two pages and the icon gallery (75,513 bytes before S1 and now). Not met: the font home, +0.54 KB (556 bytes): its hero's dither field is above the fold, and what is left is the shared glue its old copy did without (`parseColor` of hex and `rgb()`, tokens with fallbacks, `animateCanvas` with its frame rate and reduced motion); the gallery's pages, +1.8 to +1.9 KB: `PresetDemo` (S2b, alone on the seven pass pages) shares modules with ui's bundle, so Rolldown cuts them into chunks of their own (4 files a page before S1, 7 or 8 now). A build without `PresetDemo` measured 466.6 on `/shaders`, so about 1.1 KB is that split; it goes when `shaders.forgeron.sh` takes the pass pages (S4). The site's total, once everything has loaded, is above its start before S1 (home 21.1, `/pricing` 17.7): the lazy chunks are gzip'd apart and carry the field's two shader texts (1.1 KB).

7. **Parity.** The S1 harness, adapted: after load it scrolls the page down by 1 200 px steps at `t = 0` (the clock frozen, frames ticked) and back to the top, so the lazy mounts load and draw, then captures as before. On `98d358e1` the scrolled run equals the unscrolled one (67 of 67). After S2c: 67 of 67 canvases identical to `98d358e1`, every lazy canvas drawn (`cta-glow`, the hearths, `/pricing`'s globe and dissolve), 0 console errors; the site's pages again after the hero field became eager: 8 of 8.
8. **Lazy timing.** Headless Chromium (SwiftShader), 1440×900, the page scrolled to its bottom at a steady speed with a real clock, three runs locally and two on 4G (a range spans the runs):

   | Canvas                        | 2 000 px/s, local | 2 000 px/s, 4G   | 5 000 px/s, 4G |
   | ----------------------------- | ----------------- | ---------------- | -------------- |
   | `/` `cta-glow` (y 22 600)     | 197–260 → 191–239 | 267–427 → 23–192 | 214 → 1        |
   | `/` footer hearth             | 10–12 → 308–350   | 82 → 74–241      | 184 → −6 to 16 |
   | `/pricing` globe (y 6 500)    | 114 → 323         | 270 → 262–294    | 245 → 1–2      |
   | `/pricing` dissolve (y 8 200) | 108 → 349         | 237 → 216–369    | 114 → 106–109  |
   | `/pricing` footer hearth      | 27 → 422          | 91 → 99–351      | 90 → 107–114   |

   Each cell: near intersection → first draw, in ms → how long before the canvas enters the viewport it is drawn, in ms (a negative value: after). 4G is latency 60 ms, 9 Mbit/s, cache off. At 2 000 px/s the near margin (one screen, 900 px) is 450 ms of scrolling, and every lazy canvas is drawn before it shows; at 5 000 px/s (a fling, 180 ms of margin) they are drawn as they enter, the hearth once 6 ms after.

   Locally the hearth (CPU) draws 10 to 27 ms after its near intersection, and the fields' 100 to 260 ms are mostly compiling and linking their program in SwiftShader (on the home the field's code is already loaded with the hero); on 4G the chunk's fetch adds 60 to 170 ms. The hero field, eager, draws before its first intersection is reported, as before.

9. **Not done.** The font's remaining 0.54 KB and the gallery's split (note 6); a Vite `?shader` import for chains of several stages (none live today); real GPUs and browsers other than headless Chromium.
