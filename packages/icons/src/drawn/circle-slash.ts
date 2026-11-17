import type { PixelIcon } from "../types";

// Ring crossed by a diagonal slash.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-slash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#.......##",
    ".#......#.#",
    "#......#...#",
    "#.....#....#",
    "#....#.....#",
    "#...#......#",
    ".#.#.......#",
    ".##........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
