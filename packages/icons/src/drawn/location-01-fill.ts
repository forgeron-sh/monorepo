import type { PixelIcon } from "../types";

// Filled `location-01`: the outline filled in, the inner symbol cut out (2026-11-17). Generated from the
// outline drawing (fill what the outer contour encloses, keep what the inner symbol encloses
// empty, an area filled in the tone of its contour), then checked in the review sheet.
const icon: PixelIcon = {
  name: "location-01-fill",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..########",
    "..###..###",
    ".###....###",
    ".###....###",
    ".####..####",
    "..########",
    "...######",
    "....####",
    ".....##",
  ],
};

export default icon;
