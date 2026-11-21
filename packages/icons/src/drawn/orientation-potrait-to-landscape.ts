import type { PixelIcon } from "../types";

// Portrait screen turning into a landscape one, the arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "orientation-potrait-to-landscape",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "#####",
    "#...#.ooo",
    "#...#....o",
    "#...#..o.o.o",
    "#...#...ooo",
    "#...#....o",
    "#####",
    ".....#######",
    ".....#.....#",
    ".....#.....#",
    ".....#.....#",
    ".....#######",
  ],
};

export default icon;
