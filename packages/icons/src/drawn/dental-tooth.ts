import type { PixelIcon } from "../types";

// Tooth: a molar with two bumps on top and two roots.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dental-tooth",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..####..#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "...#....#",
  ],
};

export default icon;
