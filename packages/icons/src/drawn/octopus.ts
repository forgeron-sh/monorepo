import type { PixelIcon } from "../types";

// Octopus: a domed head with two eyes and four curling tentacles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "octopus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#..#..#..#",
    ".#........#",
    "..#.#..#.#",
    ".#..#..#..#",
    "#..#....#..#",
    "#..#....#..#",
    ".#..#..#..#",
  ],
};

export default icon;
