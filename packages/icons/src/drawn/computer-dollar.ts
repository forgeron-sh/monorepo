import type { PixelIcon } from "../types";

// Monitor of `computer` with a dollar sign on its screen, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-dollar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...o....#",
    ".#..oooo..#",
    ".#.oo.....#",
    ".#..ooo...#",
    ".#....oo..#",
    ".#.oooo...#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
