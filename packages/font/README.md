# @forgeron/font

Forgeron Sans, the bitmap face of the brand, drawn on a 5-pixel grid: the glyph table (`GLYPHS`, `FORGE_SANS`), measuring (`glyph`, `glyphWidth`, `textWidth`), pixel bold (`embolden`) and `textSvg`, which sets a text as a static SVG that follows `currentColor`.

The one copy of the face in the repository. `@forgeron/blueprint` (labels of a scene, and the Rust core generated from the table) and `@forgeron/ui` (pixel text, logo, shaders) both read it. It imports no other package and no Node module. The site of the typeface is `apps/font` (`@forgeron/font-site`).

```ts
import { textSvg } from "@forgeron/font";

textSvg("Forgeron"); // <svg viewBox="0 0 … 7" fill="currentColor" …>
```
