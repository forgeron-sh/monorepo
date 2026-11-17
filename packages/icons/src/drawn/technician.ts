import type { PixelIcon } from "../types";

// Technician: the person of `user-lock-01` with a wrench badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "technician",
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
    "..###....o.o",
    ".#.......ooo",
    ".#......oo",
    ".#.....oo",
    ".####..o",
  ],
};

export default icon;
