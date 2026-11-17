import type { PixelIcon } from "../types";

// Arrow in the secondary tone rising out of the tray of `inbox`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inbox-upload",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".###....###",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
