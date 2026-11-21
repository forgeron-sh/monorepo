import type { PixelIcon } from "../types";

// Ghost: a domed body with two eyes and a zigzag hem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ghost",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.#.##.#.#",
    "..#.#..#.#",
  ],
};

export default icon;
