import type { PixelIcon } from "../types";

// Arrow up out of a tray: `download-01` with the arrow turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the arrow.
const icon: PixelIcon = {
  name: "upload-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....o",
    "....ooo",
    "...o.o.o",
    "..o..o..o",
    ".....o",
    ".....o",
    ".....o",
    "",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
