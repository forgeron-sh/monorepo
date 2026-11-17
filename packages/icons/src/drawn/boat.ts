import type { PixelIcon } from "../types";

// Sailing boat: a mast, the sail in the secondary tone, a hull.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "boat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....#o",
    ".....#.o",
    ".....#..o",
    ".....#...o",
    ".....#oooo",
    ".....#",
    ".##########",
    "..#......#",
    "...######",
  ],
};

export default icon;
