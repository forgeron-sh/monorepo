import type { PixelIcon } from "../types";

// Folded map with a small globe badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maps-global-01",
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
    ".####.o.o.o",
    "....#.ooooo",
    "......o.o.o",
    ".......ooo",
  ],
};

export default icon;
