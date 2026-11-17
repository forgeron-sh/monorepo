import type { PixelIcon } from "../types";

// Save money: the open hand of `hand-heart` under a pound sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "save-money-pound",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......ooo",
    ".....o",
    "....oooo",
    ".....o",
    ".....o",
    "....ooooo",
    "",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
