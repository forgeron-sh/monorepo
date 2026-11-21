import type { PixelIcon } from "../types";

// Eiffel tower: a needle, two platforms, splayed legs and the arch between them.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "eiffel-tower",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....####",
    "....#..#",
    "....#..#",
    "...######",
    "...#....#",
    "..#..##..#",
    "..#.#..#.#",
    ".#..#..#..#",
    ".#..#..#..#",
  ],
};

export default icon;
