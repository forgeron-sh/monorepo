import type { PixelIcon } from "../types";

// Monitor on a stand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
