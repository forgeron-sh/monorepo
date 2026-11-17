import type { PixelIcon } from "../types";

// Two-by-two grid with a cross: `grid-view` with the lower-right square replaced by a cross.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grid2x2-x",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
    "",
    "",
    ".####..o...o",
    ".#..#...o.o",
    ".#..#....o",
    ".####...o.o",
    ".......o...o",
  ],
};

export default icon;
