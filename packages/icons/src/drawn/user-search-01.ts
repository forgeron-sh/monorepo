import type { PixelIcon } from "../types";

// Person with a magnifier badge, in the badge corner of `user-lock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-search-01",
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
    "..###.ooo",
    ".#....o.o",
    ".#....ooo",
    ".#.......o",
    ".####.....o",
  ],
};

export default icon;
