import type { PixelIcon } from "../types";

// Square with a dollar sign and an arrow coming in at the top right, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-receive-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...........o",
    "........o.o",
    ".#####..oo",
    "#.......ooo",
    "#...#",
    "#..###...#",
    "#..#.....#",
    "#..###...#",
    "#....#...#",
    "#..###...#",
    "#........#",
    ".########",
  ],
};

export default icon;
