import type { PixelIcon } from "../types";

// Paraglider canopy with lines down to a pilot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paragliding",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#..........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....####",
    ".....oo",
    ".....oo",
    "....o..o",
  ],
};

export default icon;
