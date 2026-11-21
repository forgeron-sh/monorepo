import type { PixelIcon } from "../types";

// Filled `one-circle`: the outline filled in, the inner symbol cut out (2026-11-17). Generated from the
// outline drawing (fill what the outer contour encloses, keep what the inner symbol encloses
// empty, an area filled in the tone of its contour), then checked in the review sheet.
const icon: PixelIcon = {
  name: "one-circle-fill",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..########",
    ".##########",
    ".#####.####",
    "#####..#####",
    "######.#####",
    "######.#####",
    "######.#####",
    ".###....###",
    ".##########",
    "..########",
    "....####",
  ],
};

export default icon;
