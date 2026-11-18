import type { PixelIcon } from "../types";

// Person with a story card badge in the secondary tone, lower right. Built on `user-settings-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-story",
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
    ".#....o...o",
    ".#....ooooo",
    ".#....o...o",
    ".####.ooooo",
  ],
};

export default icon;
