import type { PixelIcon } from "../types";

// Phone (the smartphone base) with a padlock in the secondary tone beside it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "device-access",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#...#",
    ".#...#",
    ".#...#..ooo",
    ".#...#..o.o",
    ".#...#.ooooo",
    ".#...#.ooooo",
    ".#...#.ooooo",
    ".#####",
  ],
};

export default icon;
