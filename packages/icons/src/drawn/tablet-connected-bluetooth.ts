import type { PixelIcon } from "../types";

// Tablet with a Bluetooth rune in the secondary tone, lower right. Built on `tablet-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tablet-connected-bluetooth",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    "..#......#",
    "..#",
    "..#.....o",
    "..#.....oo",
    "..#...o.o.o",
    "..#....ooo",
    "..#...o.o.o",
    "...##...oo",
    "........o",
  ],
};

export default icon;
