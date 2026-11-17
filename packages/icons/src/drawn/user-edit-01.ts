import type { PixelIcon } from "../types";

// Person with a pencil badge in the secondary tone, lower right. Built on `user-lock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-edit-01",
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
    "..###....oo",
    ".#......ooo",
    ".#.....ooo",
    ".#....ooo",
    ".####.o",
  ],
};

export default icon;
