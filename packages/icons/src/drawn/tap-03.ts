import type { PixelIcon } from "../types";

// Tap: the pointing hand of the set under three short rays aimed at the fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tap-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o..o..o",
    "..o.o.o",
    "",
    "....#",
    "....#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
