import type { PixelIcon } from "../types";

// A decimal point and a zero over an arrow pointing right: more decimals.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "decimals-arrow-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......###",
    "......#...#",
    "......#...#",
    "..##..#...#",
    "..##...###",
    "",
    "........o",
    ".........o",
    ".oooooooooo",
    ".........o",
    "........o",
  ],
};

export default icon;
