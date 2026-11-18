import type { PixelIcon } from "../types";

// A pointing hand with a padlock: touch locked. Hand of `swipe-right-01`, padlock of `user-lock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touch-locked-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    "........o.o",
    ".......ooooo",
    ".......ooooo",
    "...##",
    "..#..#",
    "..#..###",
    "..#..#..##",
    "###.....#",
    ".#......#",
    "..#....#",
    "..######",
  ],
};

export default icon;
