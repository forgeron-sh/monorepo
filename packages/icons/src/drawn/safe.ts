import type { PixelIcon } from "../types";

// Safe: a box on two feet, the dial in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "safe",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
    ".##......##",
  ],
};

export default icon;
