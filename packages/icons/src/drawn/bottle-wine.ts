import type { PixelIcon } from "../types";

// Wine bottle: a long neck, rounded shoulders and a label in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bottle-wine",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#oooooo#",
    "..#oooooo#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
