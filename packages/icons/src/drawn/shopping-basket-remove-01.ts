import type { PixelIcon } from "../types";

// A shopping basket with a minus badge. Base from `shopping-basket-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-basket-remove-01",
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
    "..#.#",
    "..#.#",
    "...###.ooooo",
  ],
};

export default icon;
