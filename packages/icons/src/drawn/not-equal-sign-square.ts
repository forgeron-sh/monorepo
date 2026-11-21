import type { PixelIcon } from "../types";

// Rounded square with a crossed-out equals sign, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "not-equal-sign-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.....o..#",
    ".#.....o..#",
    ".#.oooooo.#",
    ".#....o...#",
    ".#...o....#",
    ".#.oooooo.#",
    ".#..o.....#",
    ".#..o.....#",
    "..########",
  ],
};

export default icon;
