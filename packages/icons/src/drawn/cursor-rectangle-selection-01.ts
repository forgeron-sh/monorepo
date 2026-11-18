import type { PixelIcon } from "../types";

// Dashed selection corners and a pointer arrow inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-rectangle-selection-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##....##",
    ".#......#",
    "",
    "",
    ".....o",
    ".#...oo",
    ".##..ooo",
    ".....oooo",
    ".....ooooo",
    ".....ooo",
    ".....o.o",
  ],
};

export default icon;
