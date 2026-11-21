import type { PixelIcon } from "../types";

// Safe with a dollar mark on its door in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-safe",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..ooo...#",
    ".#..oooo..#",
    ".#...ooo..#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
    ".##......##",
  ],
};

export default icon;
