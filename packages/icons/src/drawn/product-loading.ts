import type { PixelIcon } from "../types";

// A package with a spinner arc badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "product-loading",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "..#..##..##",
    ".########.#",
    ".#..##..#.#",
    ".#..##",
    ".#.....oo",
    ".#....o",
    ".#....o...o",
    ".#....o...o",
    ".####..ooo",
  ],
};

export default icon;
