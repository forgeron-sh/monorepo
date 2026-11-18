import type { PixelIcon } from "../types";

// Scan a meal: the brackets of `scan` round an apple in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "meal-scan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#.....o..#",
    ".#....o...#",
    "...oo.ooo",
    "..oooooooo",
    "..oooooooo",
    "..oooooooo",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".###....###",
  ],
};

export default icon;
