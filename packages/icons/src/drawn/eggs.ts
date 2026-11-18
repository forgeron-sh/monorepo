import type { PixelIcon } from "../types";

// Eggs: two small eggs, the one in front overlapping the one behind.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "eggs",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".#..#",
    ".#..#",
    "#....#.##",
    "#....##..#",
    "#....##..#",
    "#...#....#",
    ".###.#....#",
    "....#....#",
    "....#....#",
    ".....####",
  ],
};

export default icon;
