import type { PixelIcon } from "../types";

// The pi sign, to insert a formula.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-pi",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..#.....#",
    ".#......##",
  ],
};

export default icon;
