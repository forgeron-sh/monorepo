import type { PixelIcon } from "../types";

// Person with two opposite arrows in the secondary tone, lower right: swap or transfer. Built on `user-check-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-arrow-left-right",
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
    "..###..o",
    ".#....ooooo",
    ".#",
    ".#....ooooo",
    ".####....o",
  ],
};

export default icon;
