import type { PixelIcon } from "../types";

// Sort ascending by number: 1 over 9 beside a down arrow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sorting-1-9",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..##.....o",
    "...#.....o",
    "...#.....o",
    "..###....o",
    ".........o",
    "..##.....o",
    ".#..#..o.o.o",
    "..###...ooo",
    "....#....o",
    "..##",
  ],
};

export default icon;
