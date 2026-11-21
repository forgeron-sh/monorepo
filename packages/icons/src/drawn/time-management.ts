import type { PixelIcon } from "../types";

// Small clock above a line that branches to two boxes: time shared between tasks. Hands in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-management",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "...#.o..#",
    "...#.oo.#",
    "...#....#",
    "....####",
    "",
    "..########",
    "####....####",
    "#..#....#..#",
    "#..#....#..#",
    "####....####",
  ],
};

export default icon;
