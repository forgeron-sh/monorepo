import type { PixelIcon } from "../types";

// Panel of `panel-left-close` with the chevron pointing right, to open it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-left-open",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oo#.....#",
    ".#oo#.#...#",
    ".#oo#..#..#",
    ".#oo#...#.#",
    ".#oo#...#.#",
    ".#oo#..#..#",
    ".#oo#.#...#",
    ".#oo#.....#",
    ".##########",
  ],
};

export default icon;
