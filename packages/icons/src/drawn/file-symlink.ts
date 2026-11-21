import type { PixelIcon } from "../types";

// File with a bent arrow badge: a symbolic link.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-symlink",
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
    ".#.......o",
    ".#....ooooo",
    ".#....o..o",
    ".#....o",
    ".####.o",
  ],
};

export default icon;
