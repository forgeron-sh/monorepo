import type { PixelIcon } from "../types";

// A shopping basket with a star badge. Base from `shopping-basket-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-basket-favorite-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#......#",
    ".##########",
    ".#..#..#..#",
    ".#..#",
    "..#.#....o",
    "..#.#..ooooo",
    "...###..ooo",
    "........ooo",
    ".......o...o",
  ],
};

export default icon;
