import type { PixelIcon } from "../types";

// Lectern: a reading desk on a post with a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lectern",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    "..#......#",
    "...######",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "...######",
    "..########",
  ],
};

export default icon;
