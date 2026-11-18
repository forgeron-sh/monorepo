import type { PixelIcon } from "../types";

// Vote.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vote",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    "..#......#",
    "..#....o.#",
    "..#.o.o..#",
    "..#..o...#",
    ".##......##",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
