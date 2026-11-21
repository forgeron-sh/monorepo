import type { PixelIcon } from "../types";

// Person with a padlock badge in the secondary tone, lower right; the shoulders stop a pixel short
// of the badge. Built on `user-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-lock-01",
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
    "..###..ooo",
    ".#.....o.o",
    ".#....ooooo",
    ".#....ooooo",
    ".####.ooooo",
  ],
};

export default icon;
