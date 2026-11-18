import type { PixelIcon } from "../types";

// Rubik's cube: the cube of `cube`, its front face cut into a three-by-three grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rubiks-cube",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "...#.....##",
    "..#.....#.#",
    ".#######..#",
    ".#.#.#.#..#",
    ".#######..#",
    ".#.#.#.#..#",
    ".#######.#",
    ".#.#.#.##",
    ".#######",
  ],
};

export default icon;
