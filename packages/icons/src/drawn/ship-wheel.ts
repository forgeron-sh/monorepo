import type { PixelIcon } from "../types";

// Ship's wheel: a ring with spokes, a hub and handles at the four points.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ship-wheel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "...######",
    "..#..##..#",
    ".#..#..#..#",
    ".#.#....#.#",
    "####....####",
    "####....####",
    ".#.#....#.#",
    ".#..#..#..#",
    "..#..##..#",
    "...######",
    ".....##",
  ],
};

export default icon;
