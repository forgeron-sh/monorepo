import type { PixelIcon } from "../types";

// Perspective: a room in one-point perspective, its back wall in the secondary tone joined to the frame by four diagonals.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "perspective",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##......##",
    ".#.#....#.#",
    ".#..oooo..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".#.#....#.#",
    ".##......##",
    ".##########",
  ],
};

export default icon;
