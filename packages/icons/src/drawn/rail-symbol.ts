import type { PixelIcon } from "../types";

// The rail symbol: two parallel tracks crossed by a zigzag of three strokes.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "rail-symbol",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "....#",
    ".....#",
    ".##########",
    ".....#",
    "....#",
    ".##########",
    "....#",
    ".....#",
    "......#",
  ],
};

export default icon;
