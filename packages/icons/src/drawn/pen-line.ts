import type { PixelIcon } from "../types";

// Pen writing a line, the line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pen-line",
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
    ".##..oooooo",
  ],
};

export default icon;
