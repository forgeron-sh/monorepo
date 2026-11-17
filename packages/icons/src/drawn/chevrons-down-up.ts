import type { PixelIcon } from "../types";

// Chevrons down up: two chevrons pointing towards each other, to collapse.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chevrons-down-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "...##..##",
    "....####",
    ".....##",
    "",
    "",
    ".....##",
    "....####",
    "...##..##",
    "...#....#",
  ],
};

export default icon;
