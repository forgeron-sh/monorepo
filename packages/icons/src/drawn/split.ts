import type { PixelIcon } from "../types";

// Split: one stem forking into two arrows, up left and up right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "split",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####..####",
    ".##......##",
    ".#.#....#.#",
    ".#..#..#..#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
