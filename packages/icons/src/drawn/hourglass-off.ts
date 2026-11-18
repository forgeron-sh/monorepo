import type { PixelIcon } from "../types";

// Hourglass off: `hourglass` struck by a 45° slash in the secondary tone, with a one-pixel clearance.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hourglass-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o..#######",
    "..o......#",
    "...o....#",
    "....o..#",
    ".....o",
    "......o",
    "....#..o",
    "...#.o..o",
    "..#oooo..o",
    ".#######..o",
    "...........o",
  ],
};

export default icon;
