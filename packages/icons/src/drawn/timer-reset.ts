import type { PixelIcon } from "../types";

// Stopwatch reset: a stopwatch whose ring opens on the left into an arrowhead in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "timer-reset",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    ".ooo.#...#",
    "..o..##..#",
    ".........#",
    "...#....#",
    "....####",
  ],
};

export default icon;
