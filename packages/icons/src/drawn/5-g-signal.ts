import type { PixelIcon } from "../types";

// 5G mobile signal: the label 5G in the secondary tone above four rising signal bars.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "5-g-signal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..ooo..ooo",
    "..o...o",
    "..ooo.o.oo",
    "....o.o..o",
    "..ooo..ooo",
    "",
    "..........#",
    ".......#..#",
    "....#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
  ],
};

export default icon;
