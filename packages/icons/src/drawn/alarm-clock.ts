import type { PixelIcon } from "../types";

// Alarm clock: two bells, a ring, the hands in the secondary tone, two feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alarm-clock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##......##",
    ".#..####..#",
    "...#....#",
    "..#..o...#",
    "..#..o...#",
    "..#..ooo.#",
    "..#......#",
    "...#....#",
    "....####",
    "...#....#",
  ],
};

export default icon;
