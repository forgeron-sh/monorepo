import type { PixelIcon } from "../types";

// A cartridge: the bullet on its case.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bullet",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....o..o",
    "....o..o",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "...######",
    "...######",
  ],
};

export default icon;
