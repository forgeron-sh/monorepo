import type { PixelIcon } from "../types";

// Cuboid: a rectangular box drawn in oblique projection.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cuboid",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....########",
    "...#......##",
    "..#......#.#",
    ".########..#",
    ".#......#..#",
    ".#......#..#",
    ".#......#.#",
    ".#......##",
    ".########",
  ],
};

export default icon;
