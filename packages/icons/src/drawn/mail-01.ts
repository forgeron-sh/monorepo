import type { PixelIcon } from "../types";

// Envelope: a box and its flap, two 1:1 diagonals meeting in the middle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".##......##",
    ".#.#....#.#",
    ".#..#..#..#",
    ".#...##...#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
