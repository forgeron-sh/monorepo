import type { PixelIcon } from "../types";

// Person with a small clock badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-time-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###..ooo",
    ".#....o.o.o",
    ".#....o.ooo",
    ".#....o...o",
    ".####..ooo",
  ],
};

export default icon;
