import type { PixelIcon } from "../types";

// File with a headphones badge, the one of `book-headphones`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-headphone",
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
    ".#....o...o",
    ".#....o...o",
    ".#....oo.oo",
    ".####.oo.oo",
  ],
};

export default icon;
