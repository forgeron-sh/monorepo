import type { PixelIcon } from "../types";

// Excavator, side view: a cab on its tracks, the boom and stick reaching right, the bucket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "excavator",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......###",
    ".....#...#",
    "....#.....#",
    "####......#",
    "#..#......#",
    "#..#####.ooo",
    "########..oo",
    "...........o",
    ".#######",
    "#.......#",
    ".#######",
  ],
};

export default icon;
