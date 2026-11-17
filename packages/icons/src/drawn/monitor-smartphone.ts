import type { PixelIcon } from "../types";

// A small monitor on its stand and a phone beside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-smartphone",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#######",
    "#.....#",
    "#.....#.oooo",
    "#.....#.o..o",
    "#.....#.o..o",
    "#.....#.o..o",
    "#######.o..o",
    "...#....o..o",
    ".#####..o..o",
    "........oooo",
  ],
};

export default icon;
