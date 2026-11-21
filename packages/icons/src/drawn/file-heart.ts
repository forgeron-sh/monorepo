import type { PixelIcon } from "../types";

// File with a heart badge, in the lower-right badge corner of the file-* family.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-heart",
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
    ".#",
    ".#....oo.oo",
    ".#....ooooo",
    ".#.....ooo",
    ".####...o",
  ],
};

export default icon;
