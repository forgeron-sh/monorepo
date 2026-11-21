import type { PixelIcon } from "../types";

// Bluetooth rune in the rounded box of `add-square`, the rune in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bluetooth-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#...o....#",
    ".#...oo...#",
    ".#.o.o.o..#",
    ".#..ooo...#",
    ".#..ooo...#",
    ".#.o.o.o..#",
    ".#...oo...#",
    ".#...o....#",
    "..########",
  ],
};

export default icon;
