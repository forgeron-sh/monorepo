import type { PixelIcon } from "../types";

// A cylinder lying on its side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "cylinder-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#.#.....##",
    "#...#.....#",
    "#...#.....#",
    "#...#.....#",
    "#...#.....#",
    ".#.#.....##",
    "..########",
  ],
};

export default icon;
