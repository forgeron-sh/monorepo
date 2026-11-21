import type { PixelIcon } from "../types";

// Thin arrow pointing left: `arrow-right-03` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-left-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....#",
    "...#",
    "..#",
    ".##########",
    "..#",
    "...#",
    "....#",
    ".....#",
  ],
};

export default icon;
