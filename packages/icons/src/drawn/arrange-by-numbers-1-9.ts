import type { PixelIcon } from "../types";

// 1 above 9, with a down arrow: sort from 1 to 9, the layout of `sorting-a-z-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrange-by-numbers-1-9",
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
