import type { PixelIcon } from "../types";

// Person with a shield badge in the secondary tone, lower right. Built on `user-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-shield-01",
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
    "..###.ooooo",
    ".#....ooooo",
    ".#....ooooo",
    ".#.....ooo",
    ".####...o",
  ],
};

export default icon;
