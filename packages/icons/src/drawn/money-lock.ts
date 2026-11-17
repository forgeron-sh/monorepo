import type { PixelIcon } from "../types";

// Banknote, cut at the lower right for a padlock in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-lock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...##...#",
    ".#..#..#..#",
    ".#...##...#",
    ".####",
    ".......ooo",
    ".......o.o",
    "......ooooo",
    "......ooooo",
    "......ooooo",
  ],
};

export default icon;
