import type { PixelIcon } from "../types";

// Banknote, cut at the lower right for a plus badge in the secondary tone (`money-not-found-01` base).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-add-02",
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
    "........o",
    "........o",
    "......ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
