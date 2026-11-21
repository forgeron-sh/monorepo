# Blueprint: design

> Status: first delivery (November 16, 2026), then the migration of the site's lab pages the same day ([`migration.md`](migration.md)). Internal package; `apps/site` is the only consumer in view and no API is frozen.

Blueprint describes small technical illustrations as **blocks** (box, line, dot, label), assembles them into an isometric **scene**, rasterises the scene at low resolution into a buffer that keeps the **material** of every pixel, then runs a chain of **filters** (pixelate, ordered dither, glow, palette, pixel grid) and writes the result to an **output** (an animated canvas, or a static SVG for the build and server rendering).

It replaced the engine of the site's lab (the former `apps/site/src/lab/engine.ts`): the isometric scenes, the WebGL backgrounds (as generator fields) and the dithered images, and it carries Forge Sans, the bitmap face of the labels and of the site's titles.

## What was wrong with the lab engine

| Problem                                                                                                                   | Consequence                                                    | Answer here                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| The Bayer matrix exists three times: `pixel.ts` (8×8), `engine.ts` (4×4 table) and the GLSL (`bayer8`)                    | three thresholds to keep in step                               | one generator, `bayer(x, y, n)` for n = 2, 4, 8 (`core/bayer.ts`); the 4×4 and 8×8 tables of the site are what it produces, a test checks both |
| The pixel is a property of the rasteriser (`data-scale`, `Raster` decides the resolution and dithers faces while filling) | a style is code; a new look means touching the engine          | the rasteriser writes materials and tones only; pixel size, dither, glow, palette and grid are filters                                         |
| Scenes are hard-coded in `SCENES` and selected by name                                                                    | adding a scene means editing the engine                        | a scene is data (`Scene`) or a function of time returning data (`SceneFn`), written anywhere                                                   |
| Three pipelines (WebGL, iso raster, dithered image) that share nothing                                                    | three ways to read tokens, observe size, honour reduced motion | one CPU frame buffer and one filter chain; the canvas glue (`dom/mount.ts`) is written once                                                    |

## Layers

```text
 Blocks (data)          box · line · dot · label           core/types.ts, core/blocks.ts
    │
 Scene                  blocks + fit options, or (t, active) → blocks
    │                   iso 2:1 projection, fit to the target (even unit)        core/project.ts
    ▼
 Rasteriser             low-resolution Frame: material · ink · tone per pixel    crates/fg-blueprint/raster
    │
 Filter chain           pixelate → dither → glow → palette → grid               core/filters.ts, raster shade.rs
    │
 Outputs                SVG string (build, SSR, no JS)                          core/svg.ts
                        canvas, animated (browser)                              dom/mount.ts
                        PNG: later, from the same RGBA                          (not in this delivery)
    │
 React                  <Blueprint> + marker components                         react/
```

Three entry points, each a layer:

- `@forgeron/blueprint`: the core. Pure TypeScript, no DOM, no React, no `node:*`. Runs in a Worker, in Node at build time, in the browser.
- `@forgeron/blueprint/dom`: `mount(canvas, scene, options)`, the canvas output (observers, animation loop, CSS variables); `mountField` (generator fields, WebGL) and `mountImage` (dithered images).
- `@forgeron/blueprint/react`: `<Blueprint>` and the declarative blocks and filters.

`.dependency-cruiser.cjs` holds the boundary: `blueprint-core-is-framework-free` forbids `src/core/` from importing `src/dom/`, `src/react/`, React or a Node module.

## Data model

Everything a scene is made of is plain data that survives `JSON.stringify`: tuples, strings, numbers, booleans. A function appears in one place only, the animated scene, and it returns data.

```ts
type Vec3 = readonly [x: number, y: number, z: number];

/** The colour family of a pixel. `signal` stays ember even when `accent` is mapped to ink. */
type Ink = "ink" | "dim" | "faint" | "accent" | "signal";

interface BlockBase {
  /** Lower layers are painted first, whatever their depth (a ground slab). */
  layer?: number;
  /** Scenery: drawn, never used to frame the scene (a floor grid, a skyline). */
  decor?: boolean;
}

interface BoxBlock extends BlockBase {
  kind: "box";
  at: Vec3;
  size: Vec3;
  /** Density of the top, left and right faces, 0 to 1. */
  tone?: readonly [top: number, left: number, right: number];
  accent?: boolean;
  signal?: boolean;
  /** Outline only, dashed: a slot or a ghost. */
  ghost?: boolean;
  /** Inset outline, studs and a ring on the top face. */
  plate?: boolean;
  /** A line on the side faces every `floors` units. */
  floors?: number;
  /** Short vertical vents on the right face. */
  vents?: boolean;
}

interface LineBlock extends BlockBase {
  kind: "line";
  a: Vec3;
  b: Vec3;
  ink?: Ink;
  dash?: number;
}
interface DotBlock extends BlockBase {
  kind: "dot";
  at: Vec3;
  ink?: Ink;
  size?: number;
}
/** A screen-aligned tag in the bitmap face, with an optional leader down to `to`. */
interface LabelBlock extends BlockBase {
  kind: "label";
  at: Vec3;
  text: string;
  to?: Vec3;
  active?: boolean;
}

type Block = BoxBlock | LineBlock | DotBlock | LabelBlock;

interface FitOptions {
  /** Share of the target the framed blocks may take, 0.82 by default. */
  fill?: number;
  /** `even` (default) keeps 2:1 edges regular; `any` allows any whole unit, for wide frames. */
  unit?: "even" | "any";
  /** Time at which an animated scene is framed, 0 by default: the framing never moves. */
  at?: number;
}

interface Scene {
  blocks: readonly Block[];
  fit?: FitOptions;
}

interface SceneFrame {
  t: number;
  active: number;
}
type SceneFn = (frame: SceneFrame) => Scene;
type SceneSource = Scene | SceneFn;
```

### Projection and fit

Iso 2:1 only, no general 3D: `P(x, y, z) = [ox + (x − y)·u, oy + (x + y)·u/2 − z·u]`. With an even unit `u`, every whole-unit point lands on a whole pixel, so a box edge advances exactly two pixels across for one down: the 2:1 line is regular.

`fit(blocks, width, height, options)` projects the framed blocks (every block not marked `decor`; a box contributes its eight corners, a line its ends, a dot or a label its anchor) at `u = 1`, takes the largest even unit that keeps them inside `fill` of the target (never below 2) and centres them. The result is a `View { u, ox, oy }`, computed once per size and reused for every frame: an animated scene does not jitter.

Labels are placed after the drawing (`labels.rs` of the raster crate, formerly `placeLabels` in `core/draw.ts`): a plate (a one-pixel frame on a solid fill) starts centred above its anchor and is moved inside the raster, so it is never clipped; it then rises until it keeps two pixels of air from the drawing (faint decor lines excepted) and from the plates placed before it, its leader growing to match, or goes down when there is no room above. When the drawing leaves no free spot, the plate stays on the first spot clear of other plates; a label that cannot avoid another plate is left out. Because the unit never falls below 2, a small canvas can hold a scene wider than its `fill`: give it a smaller `data-scale` rather than a smaller `data-fill`.

### The frame buffer: materials, not colours

This is the crux. A pixel filter applied after a vector rendering blurs the 2:1 lines and dithers the text. So the order is the reverse: **rasterise at the final low resolution first**, and keep, for each pixel, what it is made of. Filters read that.

```ts
interface Frame {
  readonly width: number;
  readonly height: number;
  /** What the pixel is: empty, a face (top, left, right), an edge, a detail line, a dot, a label part. */
  readonly material: Uint8Array;
  /** Its colour family (a `Slot`): ink, dim, faint, accent, signal, or bg for a label's fill. */
  readonly ink: Uint8Array;
  /** Its density, 0 to 1: meaningful on faces only. */
  readonly tone: Float32Array;
  /** The resolved palette slot, written by the shading filters; 0 is transparent. */
  readonly color: Uint8Array;
}
```

| Material                               | Written by                              | Dithered?                 |
| -------------------------------------- | --------------------------------------- | ------------------------- |
| `FaceTop`, `FaceLeft`, `FaceRight`     | box faces (convex fill, pixel centres)  | **yes**: tone → ink or bg |
| `Edge`                                 | box outlines, lines, label leaders      | never                     |
| `Detail`                               | floors, vents, plate inset and ring     | never                     |
| `Dot`                                  | dots, plate studs                       | never                     |
| `LabelFill`, `LabelFrame`, `LabelText` | labels, painted after every other block | never                     |
| `Field` (reserved)                     | generator blocks, later                 | yes                       |

Painter's order inside the rasteriser: blocks sorted by layer then depth (as the lab engine does), each box writes its three faces, then its details, then its edges, so a later box hides an earlier one pixel by pixel, edges included. Labels go last. Dither only ever reads face pixels: it **cannot** reach an edge or a letter, whatever the order of filters, and a test holds that.

### Filters

A filter is data too: `{ type: "dither", matrix: 4 }`. The chain is ordered by stage and each filter appears at most once; `plan(filters)` validates it and throws a `BlueprintError` that names the offending filter otherwise.

| Stage | Filter                      | Reads → writes                                                         | Default without it                                                                           |
| ----- | --------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0     | `pixelate({ size })`        | sets the raster resolution                                             | size 1: one raster pixel per CSS pixel                                                       |
| 1     | `dither({ matrix })`        | face tone → `color` (ink or bg)                                        | flat: tone ≥ 0.5 → ink, else bg                                                              |
| 2     | `glow({ radius, density })` | accent and signal pixels → dithered accent halo on empty and bg pixels | none                                                                                         |
| 3     | `palette({ colors })`       | slots → colour references                                              | the site's tokens (`--bg`, `--ink`, `--ink-dim`, `--line-strong`, `--accent`) with fallbacks |
| 4     | `grid({ gap })`             | gaps between upscaled pixels                                           | none                                                                                         |

`pixelate` is a filter in the chain the author writes, but it is **hoisted**: the plan turns it into the raster resolution instead of resampling a finished image. That is how the pixel stops being a property of the rasteriser without bringing the blur back. `grid` acts at display scale: the SVG draws each pixel smaller than its cell, the canvas draws the upscaled image itself.

Colours stay references until the last moment: `ColorRef = string | { var: "--accent"; fallback: "#ff4f1f" }`. The SVG writes `fill="var(--accent, #ff4f1f)"`, so the static picture follows the theme without JavaScript; the canvas resolves the variables through `getComputedStyle` when it mounts and when it resizes. `palette({ colors: { accent: { var: "--ink", fallback: "#ededed" } } })` reproduces the site's `data-accent="off"` (signal stays ember).

### Outputs

```ts
// core
function render(source: SceneSource, options: RenderOptions): Rendered;
function toSvg(rendered: Rendered, options?: { title?: string }): string;
function renderSvg(source: SceneSource, options: RenderOptions & { title?: string }): string;
function paint(frame: Frame, colors: ResolvedPalette, out?: Uint8ClampedArray): Uint8ClampedArray;

interface RenderOptions {
  /** Size of the target in CSS pixels; the raster is that divided by the pixel size. */
  width: number;
  height: number;
  filters?: readonly Filter[];
  t?: number;
  active?: number;
  labels?: boolean;
  /** A view computed earlier, to keep the framing while the scene moves. */
  view?: View;
}
interface Rendered {
  frame: Frame;
  view: View;
  plan: Plan;
}

// dom
function mount(canvas: HTMLCanvasElement, source: SceneSource, options?: MountOptions): Mounted;
interface MountOptions {
  filters?: readonly Filter[];
  active?: number;
  cycle?: { every: number; count: number };
  labels?: boolean;
  onActive?: (active: number) => void;
}
interface Mounted {
  update(source: SceneSource, options?: MountOptions): void;
  destroy(): void;
}
```

`mount` keeps what the lab engine did right: a `ResizeObserver` refits and redraws; an `IntersectionObserver` runs the animation loop only while the canvas is on screen; `prefers-reduced-motion` draws one frame at `t = 0`; a static scene draws once per size and runs no loop; colours come from CSS variables. PNG is left out of this delivery: `paint` already yields the RGBA a PNG encoder needs.

## React: how a scene is written in JSX

Three candidates were weighed.

| Option                                                                         | SSR                                            | Client                                 | Cost                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| A custom renderer (`react-reconciler`), blocks as host elements                | needs a second renderer on the server          | full React model, hooks inside a scene | a dependency, a reconciler to maintain, two React trees; overkill for twenty static boxes |
| Data props only: `<Blueprint scene={…} filters={[…]} />`                       | trivial                                        | trivial                                | none, but no JSX for the blocks                                                           |
| **Marker components collected from `children`** (chosen), on top of data props | trivial: collected synchronously during render | same code path                         | a 60-line collector                                                                       |

**Decision**: `<Blueprint>` takes a `scene` (data or function) and/or JSX children. The children are marker components (`<Box>`, `<Line>`, `<Dot>`, `<Label>`, `<Pixelate>`, `<Dither>`, `<Glow>`, `<Palette>`, `<Grid>`) that render nothing: `<Blueprint>` walks its children (arrays and fragments included), turns each marker into its block or filter, and passes the resulting data to the core. Nothing else happens: no reconciler, no context, no effect to build the scene. It renders on the server exactly as on the client, and the scene stays data that the core could receive from anywhere (a template, a JSON file).

The limit is stated: a component of one's own that returns markers is not expanded (the collector does not run components). Composition goes through plain functions that return markers or blocks, which is what the lab's helpers (`floor`, `racks`, `crates`) already are.

```tsx
<Blueprint width={480} height={320} title="A cube" scene={cube}>
  <Pixelate size={3} />
  <Dither matrix={4} />
  <Glow />
</Blueprint>
```

Rendering: `<Blueprint>` outputs a `<div role="img">` holding the static SVG (computed during render at `t = 0`, from `width` and `height`) and a `<canvas>`. On the client, an effect mounts the canvas; once it has drawn its first frame the SVG is hidden. Without JavaScript, or before hydration, the SVG is the picture.

## Generators

The WebGL backgrounds (ember, globe, dissolve, field) are **generator fields**: computed per pixel cell rather than projected. They run as a fragment shader (`FIELD_FRAGMENT` in `core/field.ts`, plain data) mounted by `mountField` (`dom/field.ts`), the only WebGL code of the package. The CPU path this section first anticipated (a block writing `Material.Field` tones into the frame) was measured and set aside: a full-screen hero costs 17 to 50 ms per frame on the CPU of an M4, and the shader's hash noise depends on GPU float precision, so a CPU port would not draw the same picture ([`migration.md`](migration.md), "Generators run in WebGL"). `Material.Field` stays reserved for a CPU generator that must share the frame. The shader's `bayer8` is the core's `bayer(x, y, 8)` without its half-step offset (a test checks it).

The dithered images (`data-dither-img`) are `ditherImage` (`core/image.ts`, pure) and `mountImage` (`dom/image.ts`, load, cover crop, resize): luminance between two neighbouring greys through the 4×4 Bayer threshold, warm pixels in ember.

## Alternatives set aside

- **Pixel filter as post-processing of a vector or high-resolution rendering**: the blur of 2:1 lines and the dithered letters are exactly the defects to avoid.
- **A WebGL backend for filters**: the scenes are small (a few hundred by a few hundred pixels at most); one backend keeps the SVG and the canvas pixel-identical.
- **Animatable parameters as data (keyframes, expressions)**: serialisable, but a language to design. A function of `t` returning data is enough for the site; a keyframe format can produce such a function later without changing the core.
- **A general 3D engine**: iso 2:1 is the style; perspective or rotation would break the regular pixel lines.

## Porting plan for the site's scenes

Done; [`migration.md`](migration.md) has the inventory, the decisions and the regression check.

1. `cube` and `stack`, in `src/examples/`, as reference scenes with tests (fit unit, regular 2:1 edges, dither confined to faces, SVG).
2. The other scenes and the lab helpers (`racks`, `cable`, `crates`, `scenery`) live in the site (`apps/site/src/lab/scenes.ts`) as scene functions: they are the site's illustrations. Faint lines are marked `decor`, which the lab engine did implicitly.
3. `canvas[data-iso]` is mounted with `mount` from a module script (no React island: it would add about 70 kB of gzip to pages that ship none and escape the pages' scoped styles). The `iso:scene`, `iso:select` and `iso:active` events became the typed handle `isoCanvas(el)` of the site.
4. Forge Sans lives in `@forgeron/font` (`packages/font`); Blueprint and the site import it.
5. Generators run in WebGL (above); dithered images on the CPU.

## Open points

- **The bitmap face** lives in `@forgeron/font` only (`packages/font/src/index.ts`): Blueprint, ui and the site import it.
- **Fidelity to the lab engine** is checked by properties in the package tests (framing, 2:1 regularity, materials), and was checked pixel by pixel once, during the migration, by a harness outside the repository ([`migration.md`](migration.md)).
- **One deliberate difference from the lab**: an edge shared by two faces (the front edge of a top face is also the top edge of the right face) is drawn once per face. The lab walked Bresenham from both ends, and its ties break differently in each direction, so some 2:1 edges came out three or four pixels wide per row. Blueprint walks every line from its upper end: the edge is drawn twice on the same pixels (the `cube` reference has 1 041 edge pixels where the old order gave 1 064). Dash phases now start from the upper end too.
- **The public surface** (names, the `examples` export) is provisional while the site is the only consumer.
