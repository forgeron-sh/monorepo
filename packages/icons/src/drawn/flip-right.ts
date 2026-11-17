import type { PixelIcon } from "../types";

// Flip to the right: the left half of a card drawn solid, its mirror on the right dashed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####..oo",
    ".#...#....o",
    ".#...#",
    ".#...#....o",
    ".#...#....o",
    ".#...#....o",
    ".#...#....o",
    ".#...#",
    ".#...#....o",
    "..####..oo",
  ],
};

export default icon;
