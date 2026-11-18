import type { PixelIcon } from "../types";

// Folded map of `map-plus` with a minus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "map-minus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..####..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#",
    ".#..#",
    ".####",
    "....#.ooooo",
  ],
};

export default icon;
