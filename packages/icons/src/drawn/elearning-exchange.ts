import type { PixelIcon } from "../types";

// E-learning exchange: a screen on a stand, two opposite arrows in the secondary tone on it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "elearning-exchange",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.....o..#",
    ".#.oooooo.#",
    ".#..o..o..#",
    ".#.oooooo.#",
    ".#..o.....#",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
