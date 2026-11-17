import type { PixelIcon } from "../types";

// Person with a dollar badge in the secondary tone, lower right. Built on `user-check-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-dollar",
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
    "..###..oooo",
    ".#....oo",
    ".#.....ooo",
    ".#.......oo",
    ".####.oooo",
  ],
};

export default icon;
