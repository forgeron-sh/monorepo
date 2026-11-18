import type { PixelIcon } from "../types";

// Cube in perspective: front face and the two visible edges behind it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cube",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "...#.....##",
    "..#.....#.#",
    ".#######..#",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....#.#",
    ".#.....##",
    ".#######",
  ],
};

export default icon;
