import type { PixelIcon } from "../types";

// Question mark in the box of `checkmark-square-01`: the mark of `help-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "help-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#.....oo.#",
    ".#....oo..#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
