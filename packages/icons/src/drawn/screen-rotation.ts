import type { PixelIcon } from "../types";

// Rotate the screen: a phone, a quarter arc in the secondary tone over its corner ending in a downward arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "screen-rotation",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....ooo",
    "........o",
    "..####...o",
    ".#....#...o",
    ".#....#..ooo",
    ".#....#...o",
    ".#....#",
    ".#....#",
    ".#....#",
    "..####",
  ],
};

export default icon;
