import type { PixelIcon } from "../types";

// 7Z archive file: a document whose lower right carries the letters 7Z in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "7z-01",
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
    ".#..ooo.ooo",
    ".#....o...o",
    ".#...o...o",
    ".#...o..o",
    ".###.o..ooo",
  ],
};

export default icon;
