import type { PixelIcon } from "../types";

// Three squares of a two-by-two grid, a plus in the secondary tone in place of the fourth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grid2x2-plus",
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
    ".####....o",
    ".#..#....o",
    ".#..#..ooooo",
    ".####....o",
    ".........o",
  ],
};

export default icon;
