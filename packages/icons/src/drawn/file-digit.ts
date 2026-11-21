import type { PixelIcon } from "../types";

// File with a digit: the sheet of `file-x`, a numeral 1 in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-digit",
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
    ".#.....oo",
    ".#......o",
    ".#......o",
    ".####..ooo",
  ],
};

export default icon;
