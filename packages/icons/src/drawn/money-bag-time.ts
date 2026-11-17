import type { PixelIcon } from "../types";

// Money bag, cut at the lower right for a clock in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-bag-time",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "...######",
    "..#......#",
    ".#........#",
    ".#",
    ".#.....ooo",
    ".#....o.o.o",
    ".#....o.ooo",
    "..#...o...o",
    "...##..ooo",
  ],
};

export default icon;
