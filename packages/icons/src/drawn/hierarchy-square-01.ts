import type { PixelIcon } from "../types";

// Hierarchy: a square node linked to two square nodes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-square-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#..#",
    "....####",
    ".....##",
    "..########",
    "..##....##",
    ".oooo..oooo",
    ".o..o..o..o",
    ".o..o..o..o",
    ".oooo..oooo",
  ],
};

export default icon;
