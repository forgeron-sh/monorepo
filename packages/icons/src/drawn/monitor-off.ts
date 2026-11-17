import type { PixelIcon } from "../types";

// Monitor of `monitor-pause` with a slash across its screen in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.o......#",
    ".#..o.....#",
    ".#...o....#",
    ".#....o...#",
    ".#.....o..#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
