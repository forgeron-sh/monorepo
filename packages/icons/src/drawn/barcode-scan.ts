import type { PixelIcon } from "../types";

// Barcode between the corner brackets of `scan`, the bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "barcode-scan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "...o.oo.o",
    "...o.oo.o",
    "...o.oo.o",
    "...o.oo.o",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
