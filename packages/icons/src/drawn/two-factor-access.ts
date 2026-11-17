import type { PixelIcon } from "../types";

// Phone beside a padlock in the secondary tone, two-factor access.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "two-factor-access",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#...#",
    ".#...#",
    ".#...#..oo",
    ".#...#.o..o",
    ".#...#.oooo",
    ".#...#.o..o",
    ".#...#.oooo",
    ".#####",
  ],
};

export default icon;
