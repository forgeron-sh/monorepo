import type { PixelIcon } from "../types";

// Kitchen utensils: a fork, a spoon and a knife side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kitchen-utensils",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#..#...#",
    ".#.#.#.#.##",
    ".#.#.#.#.##",
    ".###..#..##",
    "..#...#..##",
    "..#...#...#",
    "..#...#...#",
    "..#...#...#",
    "..#...#...#",
    "..#...#...#",
  ],
};

export default icon;
