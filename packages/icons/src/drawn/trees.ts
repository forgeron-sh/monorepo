import type { PixelIcon } from "../types";

// Two round trees, a small and a tall one. Tree of `tree-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "trees",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    "......#....#",
    "..##..#....#",
    ".#..#.#....#",
    ".#..#..#..#",
    "..##....##",
    ".......oo",
    "..oo....oo",
    "..oo....oo",
  ],
};

export default icon;
