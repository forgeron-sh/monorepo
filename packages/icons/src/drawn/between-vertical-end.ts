import type { PixelIcon } from "../types";

// Two side-by-side bars with a marker pointing between them from the bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "between-vertical-end",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
  ],
};

export default icon;
