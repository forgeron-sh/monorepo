import { mountDitherField } from "@forgeron/shaders/dom";

// `canvas[data-dither]`: the dither field of the lab landing pages' heroes (`mountDitherField` of
// @forgeron/shaders: the heat through the 8×8 Bayer matrix to three tones, on a 2D canvas at low
// resolution). `data-px` sets the size of a pixel. It animates only while visible and stays still
// under `prefers-reduced-motion`.

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-dither]"))
  mountDitherField(canvas, { pixel: Number(canvas.dataset.px ?? 4) });
