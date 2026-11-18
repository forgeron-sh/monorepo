import type { PixelIcon } from "../types";

// Sort descending by number: 9 over 1 beside a down arrow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sorting-9-1",
  implemented: true,
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
