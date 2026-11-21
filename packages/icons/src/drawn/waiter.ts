import type { PixelIcon } from "../types";

// Person with a serving cloche badge in the secondary tone, lower right. Built on `user-settings-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "waiter",
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
    ".#....o...o",
    ".#....ooooo",
    ".####",
  ],
};

export default icon;
