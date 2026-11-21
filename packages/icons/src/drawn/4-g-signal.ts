import type { PixelIcon } from "../types";

// 4G mobile signal: the label 4G in the secondary tone above four rising signal bars.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "4-g-signal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..o.o..ooo",
    "..o.o.o",
    "..ooo.o.oo",
    "....o.o..o",
    "....o..ooo",
    "",
    "..........#",
    ".......#..#",
    "....#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
  ],
};

export default icon;
