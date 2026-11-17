import type { PixelIcon } from "../types";

// Vegan: a V whose right arm grows a leaf, the leaf in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vegan",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........oo",
    "........oooo",
    ".........oo",
    ".#........#",
    "..#......#",
    "..#......#",
    "...#....#",
    "...#....#",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
