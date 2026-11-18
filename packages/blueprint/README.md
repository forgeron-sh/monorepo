# @forgeron/blueprint

Isometric pixel illustrations, the way the site draws them: describe **blocks** (box, line, dot, label), assemble them into a **scene**, apply **filters** (pixelate, Bayer dither, glow, palette, pixel grid), and output a static SVG (build, server rendering, no JavaScript) or an animated canvas. Also the site's dithered backgrounds (generator fields, WebGL), dithered images, and Forge Sans, its bitmap face (`textSvg`).

Internal package: `apps/site` is the only consumer in view and the API is not frozen. Design and decisions: [`docs/design.md`](docs/design.md); how the site's lab pages were migrated and checked: [`docs/migration.md`](docs/migration.md).

## Example

```tsx
import { Blueprint, Box, Dither, Glow, Line, Pixelate } from "@forgeron/blueprint/react";

<Blueprint width={480} height={320} title="A plate on a post">
  <Box at={[0, 0, 0]} size={[10, 10, 1.6]} plate accent />
  <Line a={[5, 5, 1.6]} b={[5, 5, 8]} ink="dim" dash={2} />
  <Pixelate size={3} />
  <Dither matrix={4} />
  <Glow />
</Blueprint>;
```

Without React, at build time:

```ts
import { dither, examples, pixelate, renderSvg } from "@forgeron/blueprint";

const svg = renderSvg(examples.cube, { width: 480, height: 360, filters: [pixelate(3), dither()] });
```

An animated scene is a function of `{ t, active }` that returns data: `examples.cube`, `examples.stack`.

## Layers

```text
 blocks ─▶ scene ─▶ rasteriser ─▶ frame of materials ─▶ filters ─▶ outputs
 data      iso 2:1   low resolution  face · edge · label   pixelate   SVG (core)
           fit       (pixelate)      ink · tone            dither     canvas (/dom)
                                                           glow       <Blueprint> (/react)
                                                           palette
                                                           grid
```

| Entry                        | Contents                                                                                                                                                         | Runs                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `@forgeron/blueprint`        | blocks, scene, projection and fit, frame, filters, SVG                                                                                                           | anywhere: no DOM, no React, no `node:*` |
| `@forgeron/blueprint/dom`    | `mount(canvas, scene, options)`: observers, loop, tokens; `mountField`, `mountImage`                                                                             | browser                                 |
| `@forgeron/blueprint/format` | the `.bp.json` format: types, schema, `readBlueprint`, `flatten`, `writeBlueprint`, the converter ([`docs/blueprint/format.md`](../../docs/blueprint/format.md)) | anywhere: no DOM, no React, no `node:*` |
| `@forgeron/blueprint/react`  | `<Blueprint>` and the marker components                                                                                                                          | server (SVG) and browser (canvas)       |

The scene is rasterised at the final low resolution before any filter runs, and every pixel keeps its material: dither shades faces only, never an edge or a letter.
