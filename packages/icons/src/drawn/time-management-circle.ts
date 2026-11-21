import type { PixelIcon } from "../types";

// Small clock above a line that branches to two circles: time shared between people. Hands in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-management-circle",
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
    ".##......##",
    "#..#....#..#",
    "#..#....#..#",
    ".##......##",
  ],
};

export default icon;
