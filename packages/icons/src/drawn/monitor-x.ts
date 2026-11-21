import type { PixelIcon } from "../types";

// Monitor with a cross on its screen in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-x",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
