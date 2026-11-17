import type { PixelIcon } from "../types";

// GPS fix: a ring with four ticks and a centre dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gps-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    ".##..oo..##",
    ".##..oo..##",
    "..#......#",
    "...#....#",
    "....####",
    ".....##",
  ],
};

export default icon;
