import type { PixelIcon } from "../types";

// File with a bookmark ribbon badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-bookmark",
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
    ".#.....ooo",
    ".#.....ooo",
    ".#.....ooo",
    ".####..o.o",
  ],
};

export default icon;
