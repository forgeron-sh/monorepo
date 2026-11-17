import type { PixelIcon } from "../types";

// Hand heart.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-heart",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oo.oo",
    "..ooooooo",
    "..ooooooo",
    "...ooooo",
    "....ooo",
    ".....o",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
