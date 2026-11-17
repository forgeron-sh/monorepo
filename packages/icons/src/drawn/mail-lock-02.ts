import type { PixelIcon } from "../types";

// Rounded envelope with a padlock badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-lock-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".##......##",
    ".#.#....#.#",
    ".#..#..#..#",
    ".#",
    ".#.....ooo",
    ".#.....o.o",
    "..###.ooooo",
    "......ooooo",
    "......ooooo",
  ],
};

export default icon;
