import type { PixelIcon } from "../types";

// Two square speech bubbles, the front one at the top left, the other behind it at the bottom right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "messages-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    "#......#",
    "#......#",
    "#......#.##",
    ".#..###....#",
    ".#.#.......#",
    ".##........#",
    ".....###..#",
    "........#.#",
    ".........##",
  ],
};

export default icon;
