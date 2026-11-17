import type { PixelIcon } from "../types";

// Bag of `shopping-bag-01` with a plus badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-bag-add",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "..########",
    "..#",
    "..#.....o",
    ".#......o",
    ".#....ooooo",
    ".#......o",
    ".######.o.#",
  ],
};

export default icon;
