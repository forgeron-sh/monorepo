import type { PixelIcon } from "../types";

// File with a padlock badge, built like `file-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-lock",
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
    ".#....ooooo",
    ".#....oo.oo",
    ".####.ooooo",
  ],
};

export default icon;
