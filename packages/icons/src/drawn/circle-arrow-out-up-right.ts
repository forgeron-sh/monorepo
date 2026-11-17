import type { PixelIcon } from "../types";

// An arrow leaving a ring through its open upper right, the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-out-up-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####..ooo",
    "..#.......oo",
    ".#.......o.o",
    ".#......o",
    ".#.....o..#",
    ".#....o...#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
