import type { PixelIcon } from "../types";

// 9 above 1, with a down arrow: sort from 9 to 1, the layout of `sorting-a-z-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrange-by-numbers-9-1",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".#..#....o",
    "..###....o",
    "....#....o",
    "..##.....o",
    ".........o",
    "...#.....o",
    "..##...o.o.o",
    "...#....ooo",
    "...#.....o",
    "..###",
  ],
};

export default icon;
