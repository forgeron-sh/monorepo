import type { PixelIcon } from "../types";

// A shopping basket with an arrow pointing out. Base from `shopping-basket-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-basket-check-out-01",
  implemented: true,
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
    "..#.#.....o",
    "...###.ooooo",
    "..........o",
    ".........o",
  ],
};

export default icon;
