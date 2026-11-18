import type { PixelIcon } from "../types";

// Hierarchy: a four-pixel root node, a two-pixel stem, a bus and three children in the secondary
// tone, in the style of the git icons.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy",
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
    ".....##",
    ".##########",
    ".##..##..##",
    ".oo..oo..oo",
    ".oo..oo..oo",
  ],
};

export default icon;
