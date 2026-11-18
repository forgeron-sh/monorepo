import type { PixelIcon } from "../types";

// Arrow in the secondary tone dropping into the tray of `inbox`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inbox-download",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "...oooooo",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".###....###",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
