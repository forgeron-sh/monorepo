import type { PixelIcon } from "../types";

// Two people staggered: a person of `user-multiple` in front and a second one behind in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-multiple-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oo",
    "..##..o..o",
    ".#..#.o..o",
    ".#..#..oo",
    "..##",
    ".......ooo",
    ".###..o...o",
    "#...#.o...o",
    "#...#.o...o",
    "#####",
  ],
};

export default icon;
