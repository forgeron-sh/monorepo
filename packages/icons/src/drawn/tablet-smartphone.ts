import type { PixelIcon } from "../types";

// Tablet beside a phone, the phone in the secondary tone. Same composition as `monitor-smartphone`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tablet-smartphone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    "#.....#",
    "#.....#",
    "#.....#.oooo",
    "#.....#.o..o",
    "#.....#.o..o",
    "#.....#.o..o",
    "#.....#.o..o",
    "#.....#.o..o",
    ".#####..oooo",
  ],
};

export default icon;
