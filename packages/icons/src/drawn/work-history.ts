import type { PixelIcon } from "../types";

// Work history: a briefcase with a clock badge, as in `folder-clock`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "work-history",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    ".##########",
    ".#........#",
    ".#",
    ".#.....ooo",
    ".#....o.o.o",
    ".#....o.ooo",
    ".#....o...o",
    ".####..ooo",
  ],
};

export default icon;
