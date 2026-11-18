import type { PixelIcon } from "../types";

// A double helix with a sparkle badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ai-dna",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "#....#",
    ".#..#",
    "..##",
    ".#..#",
    "#....#",
    "#....#",
    ".#..#....o",
    "..##....ooo",
    ".#..#..ooooo",
    "#....#..ooo",
    "#....#...o",
  ],
};

export default icon;
