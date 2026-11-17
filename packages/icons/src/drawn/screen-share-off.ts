import type { PixelIcon } from "../types";

// Stop sharing the screen: the monitor of `screen-share` with a cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "screen-share-off",
  implemented: true,
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
