import type { PixelIcon } from "../types";

// Z above A, with a down arrow: sort from Z to A.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sorting-z-a-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    "....#....o",
    "...#.....o",
    "..#......o",
    ".####....o",
    ".........o",
    "..##.....o",
    ".#..#..o.o.o",
    ".####...ooo",
    ".#..#....o",
    ".#..#",
  ],
};

export default icon;
