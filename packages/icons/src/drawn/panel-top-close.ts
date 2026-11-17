import type { PixelIcon } from "../types";

// Window with a top panel and an up chevron to close it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-top-close",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oooooooo#",
    ".#oooooooo#",
    ".##########",
    ".#........#",
    ".#...#....#",
    ".#..#.#...#",
    ".#.#...#..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
