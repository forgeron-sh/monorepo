import type { PixelIcon } from "../types";

// Person with an AI sparkle badge in the secondary tone, lower right. Built on `user-check-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-ai",
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
    ".#.....ooo",
    ".#....ooooo",
    ".#.....ooo",
    ".####...o",
  ],
};

export default icon;
