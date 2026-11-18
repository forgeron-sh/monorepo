import type { PixelIcon } from "../types";

// The computer of the set with a download arrow on the screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "system-update-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...o....#",
    ".#.o.o.o..#",
    ".#..ooo...#",
    ".#...o....#",
    ".#........#",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
