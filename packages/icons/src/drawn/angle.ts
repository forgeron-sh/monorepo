import type { PixelIcon } from "../types";

// Angle: a base line and a 45° side meeting in a corner, the arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "angle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........#",
    "........#",
    ".......#",
    "......#",
    ".....#",
    "....#.o",
    "...#...o",
    "..#....o",
    ".#",
    ".##########",
  ],
};

export default icon;
