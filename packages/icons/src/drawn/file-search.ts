import type { PixelIcon } from "../types";

// File with a magnifier badge, built like `file-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-search",
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
    ".#....ooo",
    ".#....o.o",
    ".#....ooo",
    ".#.......o",
    ".####.....o",
  ],
};

export default icon;
