import type { PixelIcon } from "../types";

// Folded map with two circling arrows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maps-refresh",
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
    ".#..#..ooo",
    ".####.o...o",
    "....#.oo..o",
    "......o..oo",
    ".......ooo",
  ],
};

export default icon;
