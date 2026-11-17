import type { PixelIcon } from "../types";

// Transparency: the rounded square of `square` filled with a two-pixel checkerboard in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "transparency",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#oo..oo..#",
    ".#oo..oo..#",
    ".#..oo..oo#",
    ".#..oo..oo#",
    ".#oo..oo..#",
    ".#oo..oo..#",
    ".#..oo..oo#",
    ".#..oo..oo#",
    "..########",
  ],
};

export default icon;
