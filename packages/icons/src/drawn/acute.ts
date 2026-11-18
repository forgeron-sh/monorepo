import type { PixelIcon } from "../types";

// Acute angle: a base line and a steep 2:1 side, the arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "acute",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....#",
    "....#",
    "....#",
    "...#",
    "...#.o",
    "..#...o",
    "..#...o",
    ".#...o",
    ".#",
    ".##########",
  ],
};

export default icon;
