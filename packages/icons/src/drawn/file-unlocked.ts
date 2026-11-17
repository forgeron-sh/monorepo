import type { PixelIcon } from "../types";

// File with an open padlock badge, the lock of `file-lock` with its shackle open.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-unlocked",
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
    ".#.....o",
    ".#....ooooo",
    ".#....oo.oo",
    ".####.ooooo",
  ],
};

export default icon;
