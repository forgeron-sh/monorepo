import type { PixelIcon } from "../types";

// Diagonal double arrow from top right to bottom left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move-diagonal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".........##",
    "........#.#",
    ".......#..#",
    "......#",
    ".....#",
    ".#..#",
    ".#.#",
    ".##",
    ".####",
  ],
};

export default icon;
