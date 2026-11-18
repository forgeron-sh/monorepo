import type { PixelIcon } from "../types";

// Person with a check badge in the secondary tone, lower right. Built on `user-lock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-check-01",
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
    "..###",
    ".#........o",
    ".#.......o",
    ".#....o.o",
    ".####..o",
  ],
};

export default icon;
