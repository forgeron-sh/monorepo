import type { PixelIcon } from "../types";

// Three books lying in a stack, each offset from the one below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "books-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "...#.....#",
    ".#########",
    ".#......#",
    ".#......#",
    ".##########",
    "..#.......#",
    "..#.......#",
    "..#########",
  ],
};

export default icon;
