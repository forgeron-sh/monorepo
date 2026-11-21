import type { PixelIcon } from "../types";

// Mouse with its left button highlighted and two click rays at its upper left, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-left-click-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o....####",
    ".....#oo..#",
    "oo...#oo..#",
    ".....#oo..#",
    ".....######",
    ".....#....#",
    ".....#....#",
    ".....#....#",
    ".....#....#",
    "......####",
  ],
};

export default icon;
