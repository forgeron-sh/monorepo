import type { PixelIcon } from "../types";

// File with a key: the sheet of `file-lock`, a small key badge in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-key",
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
    ".#",
    ".#....ooo",
    ".#....o.ooo",
    ".#....ooo.o",
    ".####",
  ],
};

export default icon;
