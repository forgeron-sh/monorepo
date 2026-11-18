import type { PixelIcon } from "../types";

// Add an eraser: `eraser` one step up and left (as in `ai-eraser`), a plus badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "eraser-add",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......#",
    ".....#.#",
    "....#...#",
    "...#.....#",
    "..#.....#",
    ".###...#",
    "#####.#",
    ".#####...o",
    "..###....o",
    "...#...ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
