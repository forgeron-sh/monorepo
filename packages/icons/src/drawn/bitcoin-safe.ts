import type { PixelIcon } from "../types";

// The safe of `money-safe` with a bitcoin sign on its door in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-safe",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..ooo...#",
    ".#........#",
    ".##########",
    ".##......##",
  ],
};

export default icon;
