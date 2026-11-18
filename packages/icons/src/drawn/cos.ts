import type { PixelIcon } from "../types";

// The word "cos" in pixel letters.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cos",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "..##..#...##",
    ".#...#.#.#",
    ".#...#.#..#",
    ".#...#.#...#",
    "..##..#..##",
  ],
};

export default icon;
