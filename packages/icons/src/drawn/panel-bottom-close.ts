import type { PixelIcon } from "../types";

// Panel of `panel-bottom` with a chevron pointing down, to close it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-bottom-close",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.#...#..#",
    ".#..#.#...#",
    ".#...#....#",
    ".#........#",
    ".##########",
    ".#oooooooo#",
    ".#oooooooo#",
    ".##########",
  ],
};

export default icon;
