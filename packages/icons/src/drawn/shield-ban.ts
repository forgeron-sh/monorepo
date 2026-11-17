import type { PixelIcon } from "../types";

// Shield with a no-entry sign (a ring and a slash) in the secondary tone; the shield-plus base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-ban",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..ooo...#",
    ".#.o..oo..#",
    ".#.o.o.o..#",
    ".#.oo..o..#",
    ".#..ooo...#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
