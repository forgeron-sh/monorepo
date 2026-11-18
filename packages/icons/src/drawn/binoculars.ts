import type { PixelIcon } from "../types";

// Binoculars: two barrels joined by a bridge, ending in two round lenses.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "binoculars",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".###....###",
    ".#.#....#.#",
    ".#.######.#",
    ".#.#....#.#",
    "#...#..#...#",
    "#...#..#...#",
    "#...#..#...#",
    ".###....###",
  ],
};

export default icon;
