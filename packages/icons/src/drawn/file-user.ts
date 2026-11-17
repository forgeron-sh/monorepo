import type { PixelIcon } from "../types";

// File with a person badge, the one of `book-user`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-user",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#.....ooo",
    ".#.....o.o",
    ".#.....ooo",
    ".#",
    ".####.ooooo",
  ],
};

export default icon;
