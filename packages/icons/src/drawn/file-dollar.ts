import type { PixelIcon } from "../types";

// File with a dollar sign badge in the secondary tone, built like `file-euro`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-dollar",
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
    ".#.....oooo",
    ".#....o.o",
    ".#.....ooo",
    ".#......o.o",
    ".####.oooo",
  ],
};

export default icon;
