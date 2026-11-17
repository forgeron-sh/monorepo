import type { PixelIcon } from "../types";

// Close the side panel: the frame of `layout-01`, the panel in the secondary tone, a chevron
// pointing left in the main area.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-left-close",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oo#.....#",
    ".#oo#...#.#",
    ".#oo#..#..#",
    ".#oo#.#...#",
    ".#oo#.#...#",
    ".#oo#..#..#",
    ".#oo#...#.#",
    ".#oo#.....#",
    ".##########",
  ],
};

export default icon;
