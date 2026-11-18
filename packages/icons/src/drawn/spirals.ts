import type { PixelIcon } from "../types";

// Spiral: a line coiling in to the centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "spirals",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#.##.#.#",
    ".#.#..#.#.#",
    ".#..##..#.#",
    ".#.....#..#",
    "..#####..#",
    "........#",
  ],
};

export default icon;
