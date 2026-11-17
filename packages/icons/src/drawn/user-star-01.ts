import type { PixelIcon } from "../types";

// Person with a star badge in the secondary tone, lower right. Built on `user-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-star-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###...o",
    ".#....ooooo",
    ".#.....ooo",
    ".#.....ooo",
    ".####.o...o",
  ],
};

export default icon;
