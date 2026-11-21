import type { PixelIcon } from "../types";

// A timer struck through: the timer-01 body without its hand, under a diagonal slash.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "timer-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o..####",
    "..o..##",
    "...o.###",
    "....o...#",
    "..#..o...#",
    "..#...o..#",
    "..#....o.#",
    "..#.....o",
    "...#.....o",
    "....####..o",
    "...........o",
  ],
};

export default icon;
