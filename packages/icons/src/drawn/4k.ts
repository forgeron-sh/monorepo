import type { PixelIcon } from "../types";

// 4K: the digit 4 and the letter K, like `hd`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "4k",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#..#..#..#",
    ".#..#..#.#",
    ".####..##",
    "....#..##",
    "....#..#.#",
    "....#..#..#",
  ],
};

export default icon;
