import type { PixelIcon } from "../types";

// Big outlined arrow pointing left: `arrow-right-big` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-left-big",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    ".....##",
    "....#.#####",
    "...#......#",
    "..#.......#",
    "..#.......#",
    "...#......#",
    "....#.#####",
    ".....##",
    "......#",
  ],
};

export default icon;
