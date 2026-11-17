import type { PixelIcon } from "../types";

// Hand coins.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-coins",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...o....o",
    "....oooo",
    "...o....o",
    "....oooo",
    "",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
