import type { PixelIcon } from "../types";

// Mirror of `panel-left-open`: the right panel in the secondary tone, the chevron pointing away.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-right-open",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.....#oo#",
    ".#...#.#oo#",
    ".#..#..#oo#",
    ".#.#...#oo#",
    ".#.#...#oo#",
    ".#..#..#oo#",
    ".#...#.#oo#",
    ".#.....#oo#",
    ".##########",
  ],
};

export default icon;
