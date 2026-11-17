import type { PixelIcon } from "../types";

// A vertical line in the secondary tone between two chevrons pointing away from it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "separator-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....o",
    ".....o",
    "...#.o.#",
    "..#..o..#",
    ".#...o...#",
    ".#...o...#",
    "..#..o..#",
    "...#.o.#",
    ".....o",
    ".....o",
  ],
};

export default icon;
