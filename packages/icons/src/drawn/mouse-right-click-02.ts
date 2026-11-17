import type { PixelIcon } from "../types";

// Mouse with its right button highlighted and two click rays at its upper right, in the secondary tone: `mouse-left-click-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-right-click-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...........o",
    "..####....o",
    ".#..oo#",
    ".#..oo#...oo",
    ".#..oo#",
    ".######",
    ".#....#",
    ".#....#",
    ".#....#",
    ".#....#",
    "..####",
  ],
};

export default icon;
