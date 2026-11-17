import type { PixelIcon } from "../types";

// Banknote, cut at the lower right for a cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-not-found-01",
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
    "......o...o",
    ".......o.o",
    "........o",
    ".......o.o",
    "......o...o",
  ],
};

export default icon;
