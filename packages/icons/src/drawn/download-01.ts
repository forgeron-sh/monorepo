import type { PixelIcon } from "../types";

// Arrow down into a tray: one-pixel shaft and 1:1 head, the tray two rows below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the arrow.
const icon: PixelIcon = {
  name: "download-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....o",
    ".....o",
    ".....o",
    "..o..o..o",
    "...o.o.o",
    "....ooo",
    ".....o",
    "",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
