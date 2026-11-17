import type { PixelIcon } from "../types";

// Mouse with its left button highlighted in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#oo..#",
    "...#oo..#",
    "...#oo..#",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
  ],
};

export default icon;
