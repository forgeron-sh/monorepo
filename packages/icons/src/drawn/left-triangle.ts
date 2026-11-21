import type { PixelIcon } from "../types";

// Right triangle with its right angle at the lower right, marked in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "left-triangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........##",
    "........#.#",
    ".......#..#",
    "......#...#",
    ".....#....#",
    "....#...oo#",
    "...#...o..#",
    "..#....o..#",
    ".##########",
  ],
};

export default icon;
