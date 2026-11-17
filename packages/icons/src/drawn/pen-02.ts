import type { PixelIcon } from "../types";

// Pen: a ballpoint pen on a 1:1 diagonal, as in `pen-line` without the line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pen-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    "......#..#",
    ".....#..#",
    "....#..#",
    "...#..#",
    "..#..#",
    ".#..#",
    ".#.#",
    ".##",
  ],
};

export default icon;
