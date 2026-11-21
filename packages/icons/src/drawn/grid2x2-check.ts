import type { PixelIcon } from "../types";

// Three squares of a two-by-two grid, a check in the secondary tone in place of the fourth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grid2x2-check",
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
    ".####......o",
    ".#..#.....o",
    ".#..#..o.o",
    ".####...o",
  ],
};

export default icon;
