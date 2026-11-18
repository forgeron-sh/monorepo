import type { PixelIcon } from "../types";

// A dart flying down to the left, its flights in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "dart",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........o",
    ".......o.o",
    "........o.o",
    "........#o",
    ".......#",
    "......#",
    ".....#",
    "....#",
    "...#",
    "..#",
    ".#",
    "#",
  ],
};

export default icon;
