import type { PixelIcon } from "../types";

// Wall lamp pointing up: a wall bracket, an arm, a shade, the light in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lamp-wall-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....oooo",
    "",
    "...########",
    "...#......#",
    "....#....#",
    "#....####",
    "#.....#",
    "#######",
    "#",
  ],
};

export default icon;
