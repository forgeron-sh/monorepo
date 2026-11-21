# Migrating the lab pages to Blueprint

> Status: done (November 16, 2026). The lab pages of `apps/site` (`/lab`, `/lab/landing-a` to `landing-e`) draw every canvas through `@forgeron/blueprint`; the former engine (`apps/site/src/lab/engine.ts`) and the site's copy of the face (`apps/site/src/lab/glyphs.ts`) are gone. This page records the inventory, the decisions and how the absence of regression was checked.

## Inventory

| What the pages used                                                                                                                                                                                                                    | Where now                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `canvas[data-iso]`, 18 scenes: `cube`, `stack`                                                                                                                                                                                         | the package's reference scenes (`examples.cube`, `examples.stack`)                                                                               |
| the 16 other scenes: `blocks`, `network`, `pipeline`, `bars`, `mcp`, `api`, `web`, `cli`, `resources`, `gate`, `module`, `hero-line`, `hero-pipeline`, `hero-forge`, `hero-gateway`, and helpers `racks`, `cable`, `crates`, `scenery` | `apps/site/src/lab/scenes.ts`, as scene functions built from Blueprint blocks: they are the site's illustrations, not the package's              |
| the iso rasteriser (`Raster`, `drawScene`, the fit), the 4×4 dither, the palette                                                                                                                                                       | the core: `render` with `pixelate`, `dither({ matrix: 4 })`, `palette`; the canvas glue is `mount`                                               |
| `canvas[data-shader]`: `ember`, `globe`, `dissolve`, `field` (WebGL, 8×8 Bayer in GLSL, pointer)                                                                                                                                       | generator fields: shader source in `core/field.ts`, WebGL glue `mountField` in `/dom`                                                            |
| `canvas[data-dither-img]` (only use: landing D, whose picture is missing, so the canvas hides itself)                                                                                                                                  | `ditherImage` in `core/image.ts`, `mountImage` in `/dom`                                                                                         |
| Forge Sans (`glyphs.ts`), the SVG titles, wordmark and indices (`pixelText`), `bayer8`                                                                                                                                                 | the face and `textSvg` in `core/font.ts`; the site's `pixel.ts` keeps the anvil (`pixelLogo`, brand art) and re-exports `textSvg` as `pixelText` |
| icons (`icons.ts`, `Icon.astro`)                                                                                                                                                                                                       | unchanged: not pixel scenes, outside this migration                                                                                              |

## Decisions

### Generators run in WebGL, not on the CPU frame

`design.md` left room for generator blocks writing `Material.Field` into the CPU frame. Measured on an Apple M4 with a straight CPU port of `ember` (fractal noise nested twice, five octaves):

| Hero                | Cells     | CPU, per frame |
| ------------------- | --------- | -------------- |
| 1440 × 839 at 5 px  | 288 × 168 | 17.3 ms        |
| 1440 × 900 at 4 px  | 360 × 225 | 29.0 ms        |
| 1920 × 1200 at 4 px | 480 × 300 | 49.7 ms        |

One hero alone exceeds the 16.7 ms of a 60 Hz frame on a fast machine, and the lab pages show up to six fields. Second reason: the noise hashes with `fract(sin(x) · 43758.5453)`, whose result depends on the GPU's float precision; a CPU port in double precision draws a different picture. So the fields keep a WebGL backend, for generators only: the GLSL is plain data in the neutral core (`FIELD_FRAGMENT`), the WebGL calls are in `dom/field.ts`. The shader's `bayer8` is the core's `bayer(x, y, 8)` without its half-step offset, which a test checks; `Material.Field` stays reserved for a CPU generator that would need to share the frame (none today).

### No React island: Astro pages keep plain `<canvas>` elements

| Option                                                 | Client JS (gzip, measured with `bun build --minify`) | Scoped styles                                                                                                                              | Before hydration         |
| ------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `<Blueprint>` in a React island (`client:visible`)     | 76.6 kB for one island (React DOM + Blueprint)       | lost: a page's `<style>` does not reach elements rendered by a React component, and the pages style `.hero > canvas`, `.stack-art canvas`… | static SVG               |
| **`mount` from a module script, canvases in the page** | 6.3 kB for `mount` and one scene                     | kept                                                                                                                                       | the canvas, sized by CSS |

The pages are Astro without React on the client; an island would add about 70 kB of gzip and change the DOM the pages' styles target. Decision: the canvases stay in the page markup, and `apps/site/src/lab/canvas.ts` mounts them through Blueprint:

- the `data-*` attributes stay as the declarative options of a canvas (the markup is the authoring medium of an Astro page), now parsed in one place: `data-iso`, `data-scale`, `data-fill`, `data-unit`, `data-cycle`, `data-active`, `data-labels`, `data-accent`, `data-bg` for scenes; `data-shader`, `data-px`, `data-accent`, `data-bg`, `data-ink` for fields; `data-dither-img`, `data-px`, `data-gain` for images;
- the custom events are gone. `iso:select`, `iso:scene` and `iso:active` become a typed handle, `isoCanvas(el)`, that page scripts import: `select(n)` (`-1` hands the highlight back to the cycle), `show(scene)`, `onActive(fn)`. The handle mounts the canvas on first use, so the layout's script and the page's scripts may run in any order, and `onActive` replays the current index to a late subscriber;
- no layout shift: the canvas is in the HTML with its CSS size before any script runs. Without JavaScript the canvases stay blank, as before; the titles, wordmark and indices are static SVG built at build time, unchanged. A static SVG fallback for the scenes (`renderSvg`) is possible later, at the cost of HTML weight; it was not in the former pages.

The React layer of the package stays for a consumer that already ships React.

### The face moves into the package

The site imports Forge Sans from `@forgeron/blueprint` (`textSvg`, `GLYPHS`, `FORGE_SANS`, `embolden`) and keeps no copy. `textSvg` produces the same markup as the former `pixelText` (checked on the 84 strings of the lab pages, in the four case and weight combinations), and `bayer8` is now `bayer(x, y, 8)` (same 64 thresholds).

### Behaviour kept from the former engine

- A resize redraws at once, on screen or not (the former engine did; `mount` used to wait for the canvas to be visible again).
- Fields read `--bg`, `--ink`, `--accent` once at mount; scenes and fields resolve tokens on the canvas, so a theme scoped to a section would apply (the lab defines its tokens on `:root` only, so the values are the same).
- Faint lines never drive the framing of a scene: the former engine skipped them implicitly when fitting; `scenes.ts` marks them `decor`.

## How the absence of regression was checked

A harness outside the repository (headless Chromium over the DevTools protocol, SwiftShader WebGL) captured the six pages at 1440 × 900 (DPR 1) and 375 × 812 (DPR 2) before any change, then again after: every canvas as PNG, full-page screenshots, console and network logs, the canvas inventory, under `prefers-reduced-motion: reduce` (one frame at `t = 0`) and with a frozen clock at `t = 1.7 s` and `t = 4.3 s` (animated frames). Two baseline runs were bit-identical, WebGL included, so every difference is real.

| Result (528 canvases: 3 modes × 2 viewports × 88)              | Count |
| -------------------------------------------------------------- | ----- |
| identical (the 4 fields everywhere, the hidden dithered image) | 162   |
| differs only by the documented edge fix                        | 366   |
| regression                                                     | 0     |

"Only by the edge fix" is proven per canvas: the baseline equals an offline replica of the former engine, the new capture equals an offline Blueprint render, and Blueprint with the former stroke direction (no flip in `stroke`) equals the former engine exactly. The fix touches 0.3 % to 1.9 % of a scene's pixels: shared 2:1 edges one pixel thinner per row where the old walk doubled them, and dash phases counted from the upper end. Screenshots differ only inside canvas rectangles, except one deliberate case below.

Two visible differences outside the canvases are intended:

- `/lab` names where the face now lives (`@forgeron/blueprint`, `core/font.ts`) instead of the deleted `src/lab/glyphs.ts`;
- landing A's stack legend now always highlights the layer of the first frame. The former page script subscribed to `iso:active` after the engine's first frame on that page, so the legend started blank until the cycle moved (landing C to E won the race); `onActive` replays the current index.

Behaviours checked the same before and after: the pointer bends `ember` (frames under a frozen clock bit-identical at two pointer positions), hovering the stack and resource legends highlights the layer (`select`) and toggles the legend, the hero switcher of landing E swaps the scene (`show`) and the pressed button, a resize to 1100 px refits every canvas, frames change over time, drawing stops off screen (0 draws per second for the 11 off-screen canvases of landing A) and under reduced motion (0 draws per second after the first frame), no console error, the same single 404 (`/lab/hero-forge.png`, missing in the repository, landing D) before and after. Built without JavaScript, the pages render the same static SVG titles.

One behaviour changed on purpose: under reduced motion, hovering a legend now redraws the scene with that layer highlighted; the former engine only changed the highlight on the next animation frame, which reduced motion never drew.
