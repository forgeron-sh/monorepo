import type { PixelIcon } from "../types";

// Monitor of `computer-add` showing a pulse line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-activity",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..o.....#",
    ".#..o.....#",
    ".#ooo...oo#",
    ".#...o.o..#",
    ".#....o...#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
