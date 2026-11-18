import type { PixelIcon } from "../types";

// Stopwatch: `timer-01` with two side buttons and a diagonal hand in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "timer-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#..####..#",
    "..#..##..#",
    "....####",
    "...#....#",
    "..#....o.#",
    "..#...o..#",
    "..#..o...#",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
