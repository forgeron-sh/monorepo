import type { PixelIcon } from "../types";

// Maze: a square with an entrance at the top and an exit at the bottom, walls one pixel apart.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maze",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####.#####",
    ".#........#",
    ".#.####.#.#",
    ".#.#....#.#",
    ".#.#.####.#",
    ".#.#....#.#",
    ".#.####.#.#",
    ".#......#.#",
    ".#.######.#",
    ".#####.####",
  ],
};

export default icon;
