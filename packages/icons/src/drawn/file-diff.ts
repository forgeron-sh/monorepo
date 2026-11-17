import type { PixelIcon } from "../types";

// File diff: the sheet of `file-lock`, a plus over a minus in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-diff",
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
    ".#......o",
    ".#.....ooo",
    ".#......o",
    ".#",
    ".####..ooo",
  ],
};

export default icon;
